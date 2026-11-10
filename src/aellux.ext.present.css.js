/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { presentPlaybackProperties } from "./internal/create-present-playback.js";

import { generatePresentEffectsCSS } from "./internal/present-effects.css.js";

export function generatePresentCSS(aelluxJs) {
  const presentAttribute = aelluxJs.attr("present");
  const motionAttribute = aelluxJs.attr("present-motion");
  const anchorAttribute = aelluxJs.attr("anchor");
  const reducedMotionAttribute = aelluxJs.attr("reduced-motion");
  const motion = `[${motionAttribute}]`;
  const present = `[${presentAttribute}]`;
  const presentWithoutMotion = `[${presentAttribute}=""]`;
  const presentOpacity = `[${presentAttribute}~="opacity"]`;
  const presentTransform = `[${presentAttribute}~="transform"]:not([${anchorAttribute}])`;
  const presentHeight = `[${presentAttribute}~="height"]`;
  const presentWidth = `[${presentAttribute}~="width"]`;
  const pop = aelluxJs.className("pop");
  const popping = aelluxJs.className("popping");
  const dismissing = aelluxJs.className("dismissing");
  const dismissed = aelluxJs.className("dismissed");
  const unpop = aelluxJs.className("unpop");
  const willChange = aelluxJs.className("will-change");
  const grid = aelluxJs.className("present-grid");
  const gridPresent = `${present}.${grid}`;
  const measuredPresent = `${present}:not(.${grid})`;

  return `/*! aellux.js Present Extension | SPDX-License-Identifier: Apache-2.0 */

${present} {
  --ae-from-opacity: 0;
  --ae-pop-opacity: 1;
  --ae-dismiss-opacity: 0;
  --ae-from-transform: scale(0.5);
  --ae-pop-transform: scale(1);
  --ae-dismiss-transform: scale(1.2);
  --ae-from-height: 0fr;
  --ae-pop-height: 1fr;
  --ae-dismiss-height: 0fr;
  --ae-from-width: 0fr;
  --ae-pop-width: 1fr;
  --ae-dismiss-width: 0fr;
  --ae-pop-ease: ease-out;
  --ae-dismiss-ease: ease-in;
  --ae-pop-duration: 300ms;
  --ae-dismiss-duration: 150ms;
  --ae-present-pop-threshold: 0.5;
  --ae-present-unpop-threshold: 0.5;
  --ae-present-dismiss-threshold: 0.5;
  --ae-present-gesture-distance: auto;

  transition-property: var(--ae-present-properties);
}
${gridPresent} {
  display: inline-grid;
  --ae-present-properties: opacity, transform, grid-template-rows, grid-template-columns;
}
${measuredPresent} {
  --ae-present-properties: opacity, transform, max-height, max-width;
}
${present}[${anchorAttribute}] {
  --ae-present-properties: opacity, max-height, max-width, grid-template-rows, grid-template-columns;
}
${present}>${motion} {
  place-self: stretch;
  contain: layout paint;
}
${presentWithoutMotion} {
  transition: none !important;
  will-change: auto !important;
  --ae-pop-duration: 0s !important;
  --ae-dismiss-duration: 0s !important;
}
${gridPresent}${presentWidth}.${willChange}, ${gridPresent}${presentWidth}.${willChange}>${motion}{
  min-width: 0 !important;
  width: auto !important;
  overflow: hidden !important;
}
${gridPresent}${presentHeight}.${willChange}, ${gridPresent}${presentHeight}.${willChange}>${motion}{
  min-height: 0 !important;
  height: auto !important;
  overflow: hidden !important;
}
html[${reducedMotionAttribute}="reduced"] ${present} {
  transition: none !important;
  --ae-pop-duration: 0s !important;
  --ae-dismiss-duration: 0s !important;
}
${present}.${willChange} {
  will-change: opacity, transform;
}
${gridPresent}.${willChange} {
  will-change: opacity, transform, grid-template-columns, grid-template-rows;
}
${measuredPresent}.${willChange} {
  will-change: opacity, transform, max-height, max-width;
}
${measuredPresent}${presentHeight}.${willChange},
${measuredPresent}${presentWidth}.${willChange} {
  overflow: hidden;
}
${presentOpacity} {
  opacity: var(--ae-from-opacity, 0);
}
${presentTransform} {
  transform: var(--ae-from-transform);
}
${presentOpacity}:is(.${popping}, .${pop}) {
  opacity: var(--ae-pop-opacity, 1);
}
${presentTransform}:is(.${popping}, .${pop}) {
  transform: var(--ae-pop-transform);
}
${presentOpacity}:is(.${dismissing}, .${dismissed}) {
  opacity: var(--ae-dismiss-opacity, 0);
}
${presentTransform}:is(.${dismissing}, .${dismissed}) {
  transform: var(--ae-dismiss-transform);
}
${present}.${pop}, ${present}.${popping} {
  transition-duration: var(--ae-pop-duration);
  transition-timing-function: var(--ae-pop-ease);
}
${present}.${dismissing} {
  transition-duration: var(--ae-dismiss-duration);
  transition-timing-function: var(--ae-dismiss-ease);
}
${gridPresent}${presentHeight} {
  grid-template-rows: var(--ae-from-height);
}
${gridPresent}${presentWidth} {
  grid-template-columns: var(--ae-from-width);
}
${gridPresent}${presentWidth}.${popping}, ${gridPresent}${presentWidth}.${pop} {
  grid-template-columns: var(--ae-pop-width);
}
${gridPresent}${presentHeight}.${popping}, ${gridPresent}${presentHeight}.${pop} {
  grid-template-rows: var(--ae-pop-height);
}
${gridPresent}${presentWidth}:is(.${dismissing}, .${dismissed}) { grid-template-columns: var(--ae-dismiss-width); }
${gridPresent}${presentHeight}:is(.${dismissing}, .${dismissed}) { grid-template-rows: var(--ae-dismiss-height); }
${measuredPresent}${presentHeight}:is(.${unpop}, .${dismissed}) { max-height: 0; }
${measuredPresent}${presentWidth}:is(.${unpop}, .${dismissed}) { max-width: 0; }
${present}.${popping} {
  transition-property: var(--ae-present-properties), --ae-present-pop-phase;
}
${present}.${dismissing} {
  transition-property: var(--ae-present-properties), --ae-present-pop-phase, --ae-present-dismiss-phase;
}
${present}[hidden] { display: none; }
${presentPlaybackProperties.map(property => {
  const name = property.replace(/^--ae-present-/, "");
  const output = property.startsWith("max-") ? `--ae-present-reverse-${property}` : property;
  return `@keyframes ${aelluxJs.className(`present-reverse-${name}`)} {
  from { ${output}: var(--ae-present-reverse-from-${name}); }
  to { ${output}: var(--ae-present-reverse-to-${name}); }
}`;
}).join("\n")}
${["height", "width"].map(dimension => `@keyframes ${aelluxJs.className(`present-reverse-max-${dimension}-plain`)} {
  from { max-${dimension}: var(--ae-present-reverse-from-max-${dimension}); }
  to { max-${dimension}: var(--ae-present-reverse-to-max-${dimension}); }
}`).join("\n")}
` + "\n" + generatePresentEffectsCSS(aelluxJs);
}
