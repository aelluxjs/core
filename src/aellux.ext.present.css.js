/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function generatePresentCSS(AelluxJs) {
  const presentAttribute = AelluxJs.attr("present");
  const motionAttribute = AelluxJs.attr("present-motion");
  const reducedMotionAttribute = AelluxJs.attr("reduced-motion");
  const lowHardwareAttribute = AelluxJs.attr("low-hardware");
  const motion = `[${motionAttribute}]`;
  const present = `[${presentAttribute}]`;
  const presentOpacity = `[${presentAttribute}~="opacity"]`;
  const presentTransform = `[${presentAttribute}~="transform"]`;
  const presentHeight = `[${presentAttribute}~="height"]`;
  const presentWidth = `[${presentAttribute}~="width"]`;
  const pop = AelluxJs.className("pop");
  const popping = AelluxJs.className("popping");
  const unpopping = AelluxJs.className("unpopping");
  const willChange = AelluxJs.className("will-change");

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
  --ae-pop-duration: 250ms;
  --ae-unpop-duration: 250ms;
  --ae-pop-low-steps: 4;
  --ae-unpop-low-steps: 4;

  display: inline-grid;
  transition-property: opacity, transform, grid-template-rows, grid-template-columns;
}
${present}>${motion} {
  place-self: stretch;
  contain: layout paint;
}
${present}.${willChange}>${motion} {
  min-width: 0;
  min-height: 0;
  overflow: hidden !important;
}
html[${reducedMotionAttribute}="reduced"] ${present} {
  transition: none !important;
  --ae-pop-duration: 0s;
  --ae-unpop-duration: 0s;
}
html[${lowHardwareAttribute}] ${present} {
  --ae-pop-ease: steps(var(--ae-pop-low-steps));
  --ae-unpop-ease: steps(var(--ae-unpop-low-steps));
}
${present}.${willChange} {
  will-change: opacity, transform, grid-template-columns, grid-template-rows;
}
${presentOpacity} {
  opacity: var(--ae-from-opacity, 0);
}
${presentTransform} {
  transform: var(--ae-from-transform);
}
${presentOpacity}.${popping},
${presentOpacity}.${pop} {
  opacity: var(--ae-pop-opacity, 1);
}
${presentTransform}.${popping},
${presentTransform}.${pop} {
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
${presentHeight} {
  grid-template-rows: var(--ae-from-height);
}
${presentWidth} {
  grid-template-columns: var(--ae-from-width);
}
${presentWidth}.${popping}, ${presentWidth}.${pop} {
  grid-template-columns: var(--ae-pop-width);
}
${presentHeight}.${popping}, ${presentHeight}.${pop} {
  grid-template-rows: var(--ae-pop-height);
}
${presentWidth}.${unpopping} { grid-template-columns: var(--ae-unpop-width); }
${presentHeight}.${unpopping} { grid-template-rows: var(--ae-unpop-height); }
${present}[hidden] { display: none; }
`;
}
