/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Keep the original string: WebKit's getTiming() serialization rounds linear()
// stops and is not a lossless source for replaying an advanced easing curve.
export function sampleCssEasing(api, name) {
  const points = [];
  const round = value => Math.round(value * 100000) / 100000;
  try {
    for (let index = 0; index <= 60; index++) {
      const progress = index / 60;
      const value = api.ease(name, progress);
      if (!Number.isFinite(value)) return null;
      points.push(`${round(value)} ${round(progress * 100)}%`);
    }
  } catch (_) { return null; }
  return `linear(${points.join(", ")})`;
}
