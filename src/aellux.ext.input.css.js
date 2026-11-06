/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function generateInputCSS(api) {
  const attr = name => api.attr(name);
  return `/*! aellux.js Input Extension | SPDX-License-Identifier: Apache-2.0 */
:where([${attr("shortcut-hint")}]) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-inline-size: 1.5em;
  padding: .1em .35em;
  border: var(--ae-shortcut-hint-border, 1px solid currentColor);
  border-radius: var(--ae-shortcut-hint-radius, .25em);
  color: var(--ae-shortcut-hint-color, inherit);
  background: var(--ae-shortcut-hint-background, transparent);
  font: inherit;
  line-height: 1.25;
}
:where([${attr("shortcut-hint")}])::before { content: attr(${attr("shortcut-label")}); }
:where([${attr("shortcut-source")}="gamepad"][${attr("gamepad-family")}="xbox"],
  [${attr("shortcut-source")}="gamepad"][${attr("gamepad-family")}="nintendo"]) { border-radius: 50%; }
:where([${attr("shortcut-source")}="gamepad"][${attr("gamepad-family")}="playstation"]) {
  border-radius: .4em;
  font-weight: 600;
}
@supports (position-anchor: --ae-shortcut) {
  :where([${attr("shortcut-hint-position")}="anchor"]) {
    position: absolute;
    position-anchor: var(--ae-shortcut-anchor, --ae-shortcut);
    position-area: block-start;
  }
}
`;
}
