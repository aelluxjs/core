/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Forward CSS easing, independent of Web Animations and of aellux.js easing names.
// Input time is clamped by the caller; output may overshoot the endpoints.
export function createCssEasing(value, api) {
  const name = String(value || "ease-in-out").trim().toLowerCase();
  const keywords = {
    ease: ".25,.1,.25,1", "ease-in": ".42,0,1,1",
    "ease-out": "0,0,.58,1", "ease-in-out": ".42,0,.58,1"
  };
  if (name === "linear") return progress => progress;
  const steps = /^(?:steps\(\s*(\d+)\s*(?:,\s*(jump-start|jump-end|jump-none|jump-both|start|end)\s*)?\)|step-(start|end))$/.exec(name);
  if (steps) {
    const count = steps[3] ? 1 : Number(steps[1]);
    const position = steps[3] || steps[2] || "end";
    const start = position === "start" || position === "jump-start" || position === "jump-both";
    const jumps = count + (position === "jump-both" ? 1 : position === "jump-none" ? -1 : 0);
    if (count > 0 && jumps > 0) return progress =>
      Math.max(0, Math.min(1, (Math.floor(progress * count) + (start ? 1 : 0)) / jumps));
  }
  const linear = /^linear\(([^()]*)\)$/.exec(name);
  if (linear) {
    const points = [];
    for (const stop of linear[1].split(",")) {
      const tokens = stop.trim().split(/\s+/);
      const values = tokens.filter(token => !token.endsWith("%"));
      const positions = tokens.filter(token => token.endsWith("%"));
      if (values.length !== 1 || positions.length > 2 || !tokens.every(token =>
        /^[+-]?(?:\d*\.\d+|\d+\.?)(?:e[+-]?\d+)?%?$/.test(token))) return fallback(api);
      for (const position of positions.length ? positions : [null])
        points.push({ x: position === null ? null : parseFloat(position) / 100, y: Number(values[0]) });
    }
    if (points.length < 2) return fallback(api);
    if (points[0].x === null) points[0].x = 0;
    if (points[points.length - 1].x === null) points[points.length - 1].x = 1;
    let largest = -Infinity;
    for (const point of points) if (point.x !== null) largest = point.x = Math.max(largest, point.x);
    for (let index = 1; index < points.length; index++) {
      if (points[index].x !== null) continue;
      const begin = index - 1;
      while (points[index].x === null) index++;
      for (let cursor = begin + 1; cursor < index; cursor++)
        points[cursor].x = points[begin].x + (points[index].x - points[begin].x) * (cursor - begin) / (index - begin);
    }
    return progress => {
      let index = 0;
      while (index < points.length - 1 && points[index + 1].x <= progress) index++;
      const first = points[Math.min(index, points.length - 2)], second = points[Math.min(index + 1, points.length - 1)];
      return second.x === first.x ? (progress < first.x ? first.y : second.y) :
        first.y + (second.y - first.y) * (progress - first.x) / (second.x - first.x);
    };
  }
  let curve = keywords[name] ? `cubic-bezier(${keywords[name]})` : name;
  const cubic = /^cubic-bezier\(([^()]*)\)$/.exec(curve);
  if (cubic) {
    const values = cubic[1].split(",").map(value => value.trim());
    if (values.length === 4 && values.every(value => /^[+-]?(?:\d*\.\d+|\d+\.?)(?:e[+-]?\d+)?$/.test(value)))
      curve = `cubic-bezier(${values.map(Number).join(",")})`;
  }
  if (/^cubic-bezier\(/.test(curve)) {
    try {
      api.ease(curve, .5);
      return progress => api.ease(curve, progress);
    } catch (_) { /* Invalid CSS uses the initial timing function, ease. */ }
  }
  return fallback(api);
}

function fallback(api) {
  return progress => api.ease("cubic-bezier(.25,.1,.25,1)", progress);
}
