/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function generatePresentCSS(AelluxJs) {
  const motionAttribute = AelluxJs.attr("present-motion");
  const reducedMotionAttribute = AelluxJs.attr("reduced-motion");
  const lowHardwareAttribute = AelluxJs.attr("low-hardware");
  const motion = `[${motionAttribute}]`;
  const pop = AelluxJs.className("pop");
  const popping = AelluxJs.className("popping");
  const unpopping = AelluxJs.className("unpopping");
  const willChange = AelluxJs.className("will-change");

  return `/*! aellux.js Present Extension | SPDX-License-Identifier: Apache-2.0 */

${motion} {
  --ae-from-opacity: 0;
  --ae-pop-opacity: 1;
  --ae-unpop-opacity: 0;
  --ae-from-transform: scale(0.5);
  --ae-pop-transform: scale(1);
  --ae-unpop-transform: scale(1.2);
  --ae-pop-ease: ease-out;
  --ae-unpop-ease: ease-in;
  --ae-pop-duration: 250ms;
  --ae-unpop-duration: 250ms;
  --ae-pop-low-steps: 4;
  --ae-unpop-low-steps: 4;
  --ae-transition-property: opacity, transform, grid-template-columns, grid-template-rows;
  --ae-pop-transition-duration: var(--ae-pop-duration), var(--ae-pop-duration), var(--ae-pop-duration), var(--ae-pop-duration);
  --ae-pop-transition-timing-function: linear, var(--ae-pop-ease, linear), var(--ae-pop-ease, linear), var(--ae-pop-ease, linear);
  --ae-unpop-transition-duration: var(--ae-unpop-duration), var(--ae-unpop-duration), var(--ae-unpop-duration), var(--ae-unpop-duration);
  --ae-unpop-transition-timing-function: linear, var(--ae-unpop-ease, linear), var(--ae-unpop-ease, linear), var(--ae-unpop-ease, linear);
  transition-property: var(--ae-transition-property);
}
html[${reducedMotionAttribute}="reduced"] ${motion} {
  transition: none !important;
}
html[${lowHardwareAttribute}] ${motion} {
  --ae-pop-ease: steps(var(--ae-pop-low-steps));
  --ae-unpop-ease: steps(var(--ae-unpop-low-steps));
}
${motion}.${willChange} {
  contain: layout paint;
  will-change: var(--ae-transition-property);
  transform: translateZ(0);
}
${motion}:not(.${popping}, .${pop}, .${unpopping}, [hidden]) {
  transition-duration: var(--ae-pop-transition-duration);
  transition-timing-function: var(--ae-pop-transition-timing-function);
  opacity: var(--ae-from-opacity, 0);
  transform: var(--ae-from-transform);
}
${motion}.${popping},
${motion}.${pop} {
  transition-duration: var(--ae-pop-transition-duration);
  transition-timing-function: var(--ae-pop-transition-timing-function);
  opacity: var(--ae-pop-opacity, 1);
  transform: var(--ae-pop-transform);
}
${motion}.${unpopping} {
  transition-duration: var(--ae-unpop-transition-duration);
  transition-timing-function: var(--ae-unpop-transition-timing-function);
  opacity: var(--ae-unpop-opacity, 0);
  transform: var(--ae-unpop-transform);
}
[${motionAttribute}*="height"].${popping},
[${motionAttribute}*="width"].${popping},
[${motionAttribute}*="height"].${unpopping},
[${motionAttribute}*="width"].${unpopping} {
  display: grid;
}
[${motionAttribute}*="width"].${popping} { grid-template-columns: 1fr; }
[${motionAttribute}*="height"].${popping} { grid-template-rows: 1fr; }
[${motionAttribute}*="width"].${unpopping} { grid-template-columns: 0fr; }
[${motionAttribute}*="height"].${unpopping} { grid-template-rows: 0fr; }
`;
}
