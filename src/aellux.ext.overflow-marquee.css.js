/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function generateOverflowMarqueeCSS(AelluxJs) {
  const attribute = AelluxJs.attr("overflow-marquee");
  const selector = `[${attribute}]:is([${attribute}=""],[${AelluxJs.attr("overflow-marquee-ready")}])`;
  const contentAttribute = AelluxJs.attr("overflow-marquee-content");
  const activeAttribute = AelluxJs.attr("overflow-marquee-active");
  const viewportAttribute = AelluxJs.attr("overflow-marquee-viewport");
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
:where([${viewportAttribute}]) {
  display: block;
  position: relative;
  min-width: 0;
  overflow: hidden;
  overflow: clip;
  --ae-overflow-marquee-fade-size: inherit;
  --ae-overflow-marquee-size: max(0px, var(--ae-overflow-marquee-fade-size, 16px));
  --ae-overflow-marquee-left: min(50%, var(--ae-overflow-marquee-size), max(0px, var(--ae-overflow-marquee-offset)));
  --ae-overflow-marquee-right: min(50%, var(--ae-overflow-marquee-size), max(0px, calc(var(--ae-overflow-marquee-distance) - var(--ae-overflow-marquee-offset))));
}
:where([${viewportAttribute}][dir="rtl"]) {
  --ae-overflow-marquee-left: min(50%, var(--ae-overflow-marquee-size), max(0px, calc(var(--ae-overflow-marquee-distance) - var(--ae-overflow-marquee-offset))));
  --ae-overflow-marquee-right: min(50%, var(--ae-overflow-marquee-size), max(0px, var(--ae-overflow-marquee-offset)));
}
:where([${viewportAttribute}="fade"]) {
  --ae-overflow-marquee-mask: linear-gradient(to right,
    transparent calc(var(--ae-overflow-marquee-left) - var(--ae-overflow-marquee-size)),
    #000 var(--ae-overflow-marquee-left),
    #000 calc(100% - var(--ae-overflow-marquee-right)),
    transparent calc(100% + var(--ae-overflow-marquee-size) - var(--ae-overflow-marquee-right)));
  -webkit-mask-image: var(--ae-overflow-marquee-mask);
  mask-image: var(--ae-overflow-marquee-mask);
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
:where([${activeAttribute}]>[${viewportAttribute}]>[${contentAttribute}]) {
  width: max-content;
  overflow: visible;
  transform: translate3d(var(--ae-anchor-x, 0px), 0, 0);
}
:where(html[${reducedMotionAttribute}="reduced"] [${attribute}]>[${viewportAttribute}]) {
  --ae-overflow-marquee-offset: 0px !important;
  transition: none !important;
}
:where(html[${reducedMotionAttribute}="reduced"] [${attribute}]>[${viewportAttribute}]>[${contentAttribute}]) {
  width: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  transform: none !important;
  transition: none !important;
}
`;
}
