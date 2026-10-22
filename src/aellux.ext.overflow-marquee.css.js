/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function generateOverflowMarqueeCSS(AelluxJs) {
  const selector = `[${AelluxJs.attr("overflow-marquee")}]`;
  const contentAttribute = AelluxJs.attr("overflow-marquee-content");
  const activeAttribute = AelluxJs.attr("overflow-marquee-active");
  const reducedMotionAttribute = AelluxJs.attr("reduced-motion");

  return `/*! aellux.js Overflow Marquee Extension | SPDX-License-Identifier: Apache-2.0 */

:where(${selector}:not([hidden])) {
  display: block;
}
:where(${selector}) {
  position: relative;
  min-width: 0;
  overflow: hidden;
  overflow: clip;
  text-overflow: ellipsis;
  white-space: nowrap !important;
}
:where([${contentAttribute}]) {
  display: block;
  position: relative;
  width: auto;
  max-width: none;
  contain: none;
  visibility: inherit;
  opacity: 1;
  pointer-events: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap !important;
  transform: none;
  transition: none;
}
:where([${activeAttribute}]>[${contentAttribute}]) {
  width: max-content;
  overflow: visible;
  transform: translate3d(var(--ae-anchor-x, 0px), 0, 0);
}
:where(html[${reducedMotionAttribute}="reduced"] ${selector}>[${contentAttribute}]) {
  width: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  transform: none !important;
  transition: none !important;
}
`;
}
