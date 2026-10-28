/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function generatePresentCSS(AelluxJs) {
  const presentAttribute = AelluxJs.attr("present");
  const motionAttribute = AelluxJs.attr("present-motion");
  const anchorAttribute = AelluxJs.attr("anchor");
  const reducedMotionAttribute = AelluxJs.attr("reduced-motion");
  const motion = `[${motionAttribute}]`;
  const present = `[${presentAttribute}]`;
  const presentWithoutMotion = `[${presentAttribute}=""]`;
  const presentOpacity = `[${presentAttribute}~="opacity"]`;
  const presentTransform = `[${presentAttribute}~="transform"]:not([${anchorAttribute}])`;
  const presentHeight = `[${presentAttribute}~="height"]`;
  const presentWidth = `[${presentAttribute}~="width"]`;
  const pop = AelluxJs.className("pop");
  const popping = AelluxJs.className("popping");
  const unpopping = AelluxJs.className("unpopping");
  const willChange = AelluxJs.className("will-change");
  const grid = AelluxJs.className("present-grid");
  const gridPresent = `${present}.${grid}`;
  const measuredPresent = `${present}:not(.${grid})`;

  return `/*! aellux.js Present Extension | SPDX-License-Identifier: Apache-2.0 */

${present} {
  --ae-from-opacity: 0;
  --ae-pop-opacity: 1;
  --ae-unpop-opacity: 0;
  --ae-from-transform: scale(0.5);
  --ae-pop-transform: scale(1);
  --ae-unpop-transform: scale(1.2);
  --ae-from-height: 0fr;
  --ae-pop-height: 1fr;
  --ae-unpop-height: 0fr;
  --ae-from-width: 0fr;
  --ae-pop-width: 1fr;
  --ae-unpop-width: 0fr;
  --ae-pop-ease: ease-out;
  --ae-unpop-ease: ease-in;
  --ae-pop-duration: 300ms;
  --ae-unpop-duration: 150ms;

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
  --ae-unpop-duration: 0s !important;
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
  --ae-unpop-duration: 0s !important;
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
${presentOpacity}.${unpopping} {
  opacity: var(--ae-unpop-opacity, 0);
}
${presentTransform}.${unpopping} {
  transform: var(--ae-unpop-transform);
}
${present}.${pop}, ${present}.${popping} {
  transition-duration: var(--ae-pop-duration);
  transition-timing-function: var(--ae-pop-ease);
}
${present}.${unpopping} {
  transition-duration: var(--ae-unpop-duration);
  transition-timing-function: var(--ae-unpop-ease);
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
${gridPresent}${presentWidth}.${unpopping} { grid-template-columns: var(--ae-unpop-width); }
${gridPresent}${presentHeight}.${unpopping} { grid-template-rows: var(--ae-unpop-height); }
${present}.${popping} {
  transition-property: var(--ae-present-properties), --ae-present-pop-phase;
}
${present}.${unpopping} {
  transition-property: var(--ae-present-properties), --ae-present-unpop-phase;
}
${present}[hidden] { display: none; }
`;
}
