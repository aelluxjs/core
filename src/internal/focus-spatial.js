/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function validSpatialRect(rect) {
  return !!rect && [rect.left, rect.top, rect.right, rect.bottom].every(Number.isFinite) &&
    rect.right > rect.left && rect.bottom > rect.top;
}

// Pure rectangle selection. Reads and eligibility belong to Focus; ties keep
// candidate order. A perpendicular beam wins before distance, avoiding diagonal
// jumps past aligned controls. No viewport filter, wrapping or geometry cache.
export function selectSpatialCandidate(origin, candidates, direction) {
  if (!["left", "right", "up", "down"].includes(direction)) return null;
  const horizontal = direction === "left" || direction === "right";
  const forward = direction === "right" || direction === "down";
  const start = horizontal ? "left" : "top", end = horizontal ? "right" : "bottom";
  const crossStart = horizontal ? "top" : "left", crossEnd = horizontal ? "bottom" : "right";
  if (origin && !validSpatialRect(origin)) return null;
  let best = null, bestScore = null;
  for (const candidate of candidates) {
    const rect = candidate.rect;
    if (!validSpatialRect(rect)) continue;
    let score;
    if (!origin) {
      // A context without a target enters from the requested edge, visually.
      score = [forward ? rect[start] : -rect[end], rect[crossStart]];
    } else {
      const advance = ((rect[start] + rect[end]) - (origin[start] + origin[end])) / 2 * (forward ? 1 : -1);
      if (advance <= 0) continue;
      const overlap = Math.min(origin[crossEnd], rect[crossEnd]) - Math.max(origin[crossStart], rect[crossStart]);
      const primaryGap = Math.max(0, forward ? rect[start] - origin[end] : origin[start] - rect[end]);
      const crossGap = Math.max(0, -overlap);
      const crossOffset = Math.abs((rect[crossStart] + rect[crossEnd] - origin[crossStart] - origin[crossEnd]) / 2);
      score = [overlap > 0 ? 0 : 1, primaryGap + crossGap * 3 + crossOffset * 0.1, advance];
    }
    const different = bestScore && score.findIndex((value, index) => value !== bestScore[index]);
    if (!bestScore || (different >= 0 && score[different] < bestScore[different])) {
      best = candidate; bestScore = score;
    }
  }
  return best;
}
