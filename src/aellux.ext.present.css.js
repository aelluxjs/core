/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function generatePresentCSS(AelluxJs) {
  const presentAttribute = AelluxJs.attr("present");
  const motionAttribute = AelluxJs.attr("present-motion");
  const reducedMotionAttribute = AelluxJs.attr("reduced-motion");
  const lowHardwareAttribute = AelluxJs.attr("low-hardware");
  const motion = `[${motionAttribute}]`;
  const present = `[${presentAttribute}]`;
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
}
${motion} {
  contain: layout paint;
  overflow: clip;
  transition-property: opacity, transform;
}
html[${reducedMotionAttribute}="reduced"] ${motion},
html[${reducedMotionAttribute}="reduced"] ${present} {
  transition: none !important;
  --ae-pop-duration: 0s;
  --ae-unpop-duration: 0s;
}
html[${lowHardwareAttribute}] ${present} {
  --ae-pop-ease: steps(var(--ae-pop-low-steps));
  --ae-unpop-ease: steps(var(--ae-unpop-low-steps));
}
${present}.${willChange}>${motion}{
  will-change: opacity, transform;
  transform: translateZ(0);
}
${presentHeight}.${willChange} {
  will-change: grid-template-rows;
}
${presentWidth}.${willChange} {
  will-change: grid-template-columns;
}
${presentWidth}${presentHeight}.${willChange} {
  will-change: grid-template-columns, grid-template-rows;
}
${present}:not([hidden])>${motion} {
  opacity: var(--ae-from-opacity, 0);
  transform: var(--ae-from-transform);
}
${present}.${popping}>${motion},
${present}.${pop}>${motion} {
  opacity: var(--ae-pop-opacity, 1);
  transform: var(--ae-pop-transform);
}
${present}.${unpopping}>${motion} {
  opacity: var(--ae-unpop-opacity, 0);
  transform: var(--ae-unpop-transform);
}
${presentHeight}.${pop}, ${presentWidth}.${pop},
${presentHeight}.${popping}, ${presentWidth}.${popping},
${present}>${motion} {
  transition-duration: var(--ae-pop-duration);
  transition-timing-function: var(--ae-pop-ease);
}
${presentHeight}.${unpopping}, ${presentWidth}.${unpopping},
${present}.${unpopping}>${motion} {
  transition-duration: var(--ae-unpop-duration);
  transition-timing-function: var(--ae-unpop-ease);
}
${presentHeight}, ${presentWidth} {
  display: grid;
}
${presentHeight} {
  transition-property: grid-template-rows;
  grid-template-rows: var(--ae-from-height);
}
${presentWidth} {
  transition-property: grid-template-columns;
  grid-template-columns: var(--ae-from-width);
}
${presentWidth}${presentHeight} {
  transition-property: grid-template-columns, grid-template-rows;
}
${presentWidth}.${popping}, ${presentWidth}.${pop} {
  grid-template-columns: var(--ae-pop-width);
}
${presentHeight}.${popping}, ${presentHeight}.${pop} {
  grid-template-rows: var(--ae-pop-height);
}
${presentWidth}.${unpopping} { grid-template-columns: var(--ae-unpop-width); }
${presentHeight}.${unpopping} { grid-template-rows: var(--ae-unpop-height); }
`;
}
