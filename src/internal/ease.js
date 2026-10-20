/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

const EASE_PREFIX = "ease";
const IN = "in";
const OUT = "out";
const IN_OUT = "inout";
const DIRECTIONS = [IN_OUT, OUT, IN];

const QUAD = "quad";
const CUBIC = "cubic";
const QUART = "quart";
const QUINT = "quint";
const SINE = "sine";
const EXPO = "expo";
const CIRC = "circ";
const BACK = "back";
const ELASTIC = "elastic";
const BOUNCE = "bounce";
const FAMILIES = [QUAD, CUBIC, QUART, QUINT, SINE, EXPO, CIRC, BACK, ELASTIC, BOUNCE];
const ALIASES = {
  quadratic: QUAD, quartic: QUART, quintic: QUINT,
  sinusoidal: SINE, exponential: EXPO, circular: CIRC
};

const CSS_NUMBER = /^[+-]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?$/i;

function bezierCoordinate(u, p1, p2) {
  const v = 1 - u;
  return 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u;
}

export function cubicBezier(t, x1, y1, x2, y2) {
  if (![t, x1, y1, x2, y2].every(value => typeof value === "number" && Number.isFinite(value))) {
    throw new TypeError("cubicBezier(t, x1, y1, x2, y2) requires finite numbers");
  }
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    throw new RangeError("Cubic bezier x coordinates must be between 0 and 1");
  }
  t = Math.min(1, Math.max(0, t));
  if (t === 0 || t === 1) return t;
  if (x1 === y1 && x2 === y2) return t;

  // Input progress is X, not the curve parameter. Bisection also handles
  // zero derivatives, including coincident and reversed control points.
  let low = 0;
  let high = 1;
  let u = t;
  for (let i = 0; i < 40; i++) {
    const x = bezierCoordinate(u, x1, x2);
    if (x === t) break;
    if (x < t) low = u;
    else high = u;
    u = (low + high) / 2;
  }
  return bezierCoordinate(u, y1, y2);
}

function bounceOut(t) {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) {
    t -= 1.5 / d;
    return n * t * t + 0.75;
  }
  if (t < 2.5 / d) {
    t -= 2.25 / d;
    return n * t * t + 0.9375;
  }
  t -= 2.625 / d;
  return n * t * t + 0.984375;
}

function easeIn(family, t) {
  switch (family) {
    case QUAD: return t * t;
    case CUBIC: return t * t * t;
    case QUART: return t * t * t * t;
    case QUINT: return t * t * t * t * t;
    case SINE: return 1 - Math.cos(t * Math.PI / 2);
    case EXPO: return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
    case CIRC: return 1 - Math.sqrt(1 - t * t);
    case BACK: return t * t * (2.70158 * t - 1.70158);
    case ELASTIC:
      return t === 0 || t === 1 ? t
        : -Math.pow(2, 10 * t - 10) *
          Math.sin((10 * t - 10.75) * 2 * Math.PI / 3);
    case BOUNCE: return 1 - bounceOut(1 - t);
    default: throw new RangeError(`Unknown easing family: ${family}`);
  }
}

export function ease(name, t) {
  if (typeof name !== "string" || typeof t !== "number" || !Number.isFinite(t)) {
    throw new TypeError("ease(name, t) requires a name and a finite number");
  }
  t = Math.min(1, Math.max(0, t));
  const bezier = /^cubic-bezier\(([^()]*)\)$/i.exec(name.trim());
  if (bezier) {
    const points = bezier[1].split(",").map(value => value.trim());
    if (points.length !== 4 || !points.every(value => CSS_NUMBER.test(value))) {
      throw new RangeError(`Invalid cubic bezier: ${name}`);
    }
    return cubicBezier(t, ...points.map(Number));
  }
  let key = name.replace(/[\s_-]/g, "").toLowerCase();
  if (key.startsWith(EASE_PREFIX)) key = key.slice(EASE_PREFIX.length);
  if (key === "linear") return t;
  if (key === "smoothstep") return t * t * (3 - 2 * t);
  if (key === "smootherstep") return t * t * t * (t * (6 * t - 15) + 10);

  let family = "";
  let direction = "";
  for (const candidate of DIRECTIONS) {
    if (key.endsWith(candidate)) {
      family = key.slice(0, -candidate.length);
      direction = candidate;
      break;
    }
    if (key.startsWith(candidate)) {
      family = key.slice(candidate.length);
      direction = candidate;
      break;
    }
  }
  family = ALIASES[family] || family;
  if (!FAMILIES.includes(family)) throw new RangeError(`Unknown easing: ${name}`);

  if (direction === IN) return easeIn(family, t);
  if (direction === OUT) return 1 - easeIn(family, 1 - t);
  if (family === BACK) {
    const c = 1.70158 * 1.525;
    const x = t < 0.5 ? 2 * t : 2 * t - 2;
    return t < 0.5
      ? x * x * ((c + 1) * x - c) / 2
      : (x * x * ((c + 1) * x + c) + 2) / 2;
  }
  if (family === ELASTIC) {
    if (t === 0 || t === 1) return t;
    const wave = Math.sin((20 * t - 11.125) * 2 * Math.PI / 4.5);
    return t < 0.5
      ? -Math.pow(2, 20 * t - 10) * wave / 2
      : Math.pow(2, -20 * t + 10) * wave / 2 + 1;
  }
  return t < 0.5
    ? easeIn(family, 2 * t) / 2
    : 1 - easeIn(family, 2 - 2 * t) / 2;
}
