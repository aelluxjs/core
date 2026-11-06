/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Shared descriptor contract: execution belongs to Focus, presentation to Input.
export function parseShortcuts(value) {
  return String(value || "").split(";").map(part => {
    const match = part.trim().match(/^([a-z][a-z0-9-]*):([^:;\s]+)$/i);
    if (!match) return null;
    const tokens = match[2].split("+");
    const code = tokens.pop();
    const modifiers = tokens.map(token => token.toLowerCase()).sort();
    if (!code || modifiers.some(token => !["alt", "ctrl", "meta", "shift"].includes(token)) ||
      new Set(modifiers).size !== modifiers.length) return null;
    return Object.freeze({ source: match[1].toLowerCase(), code, modifiers: Object.freeze(modifiers) });
  }).filter(Boolean);
}

export function matchesShortcut(shortcut, command) {
  const modifiers = command.modifiers || {};
  return shortcut.source === command.source && shortcut.code === command.code &&
    ["alt", "ctrl", "meta", "shift"].every(name => !!modifiers[name] === shortcut.modifiers.includes(name));
}

export function shortcutLabel(shortcut, family = "generic") {
  if (!shortcut) return "";
  const faces = {
    xbox: { south: "A", east: "B", west: "X", north: "Y" },
    playstation: { south: "×", east: "○", west: "□", north: "△" },
    nintendo: { south: "B", east: "A", west: "Y", north: "X" }
  };
  const label = shortcut.source === "keyboard"
    ? shortcut.code.replace(/^Key(?=[A-Z]$)|^Digit(?=\d$)/g, "")
    : (faces[family] && faces[family][shortcut.code]) || shortcut.code;
  return [...shortcut.modifiers.map(name => name[0].toUpperCase() + name.slice(1)), label].join("+");
}
