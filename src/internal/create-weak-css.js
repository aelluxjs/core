/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export default function createWeakCss() {
  return `
:where(html) { color-scheme: light dark; }
:where(html[?color-scheme='dark']) { color-scheme: dark; }
:where(html[?color-scheme='light']) { color-scheme: light; }
:where(body,html) { font-family: system-ui; background-color: Canvas; color: CanvasText; }
:where(button,a[href],[role='button'],[role='tab']) { touch-action: manipulation; }
[?wait-mounted]:not(.%mounted) > *:not([?loader]) { visibility: hidden !important; }
[?wait-mounted].%mounted > [?loader] { display: none !important; }
:where([?present-motion]) {
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
  transition-property: opacity, transform;
}
:where([?present-motion]:not(.%popping, .%pop, .%unpopping, [hidden])) {
  transition-duration: var(--ae-pop-duration), var(--ae-pop-duration);
  transition-timing-function: linear, var(--ae-pop-ease, linear);
  opacity: var(--ae-from-opacity, 0);
  transform: var(--ae-from-transform);
}
:where([?present-motion].%popping, [?present-motion].%pop) {
  transition-duration: var(--ae-pop-duration), var(--ae-pop-duration);
  transition-timing-function: linear, var(--ae-pop-ease, linear);
  opacity: var(--ae-pop-opacity, 1);
  transform: var(--ae-pop-transform);
}
:where([?present-motion].%unpopping) {
  transition-duration: var(--ae-unpop-duration), var(--ae-unpop-duration);
  transition-timing-function: linear, var(--ae-unpop-ease, linear);
  opacity: var(--ae-unpop-opacity, 0);
  transform: var(--ae-unpop-transform);
}`;
}
