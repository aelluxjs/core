/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function parseOverflowMarqueeLimit(value) {
  const text = (value || "").trim();
  if (!text) return null;
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)(?:px)?$/i.test(text)) return undefined;
  const limit = parseFloat(text);
  return Number.isFinite(limit) ? limit : undefined;
}
