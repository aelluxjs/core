import assert from "node:assert/strict";
import { test } from "node:test";
import { parseShortcuts, matchesShortcut, shortcutLabel } from "../../src/internal/input-shortcuts.js";

test("shortcut parsing shares exact physical/modifier and family presentation contracts", () => {
  const descriptors = parseShortcuts("keyboard:Ctrl+Shift+KeyI; gamepad:north; invalid; keyboard:Foo+KeyI");
  assert.equal(descriptors.length, 2);
  assert.equal(matchesShortcut(descriptors[0], { source: "keyboard", code: "KeyI", modifiers: { ctrl: true, shift: true } }), true);
  assert.equal(matchesShortcut(descriptors[0], { source: "keyboard", code: "KeyI", modifiers: { ctrl: true } }), false);
  assert.equal(shortcutLabel(descriptors[1], "playstation"), "△");
  assert.equal(shortcutLabel(descriptors[1], "nintendo"), "X");
});
