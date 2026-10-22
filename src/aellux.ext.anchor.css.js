/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function generateAnchorCSS(AelluxJs) {
  const attribute = AelluxJs.attr("anchor");
  const matchAttribute = AelluxJs.attr("anchor-match");
  const reducedMotionAttribute = AelluxJs.attr("reduced-motion");
  const anchoredClass = AelluxJs.className("anchored");
  const switchingClass = AelluxJs.className("anchor-switching");

  return `/*! aellux.js Anchor Extension | SPDX-License-Identifier: Apache-2.0 */

:where([${attribute}]) {
  visibility: hidden;
  pointer-events: none;
  position: absolute;
  contain: layout paint;
}

:where([${attribute}].${anchoredClass}) {
  pointer-events: all;
  opacity: var(--anchor-opacity, 1);
  left: 0;
  top: 0;
  transform: translate3d(var(--ae-anchor-x, 0px), var(--ae-anchor-y, 0px), 0);
  transform-origin: var(--ae-anchor-origin-x, 50%) var(--ae-anchor-origin-y, 0%);
  visibility: visible;
}
:where([${attribute}][${matchAttribute}~="width"]) {
  width: var(--ae-anchor-target-width, 0px);
  box-sizing: border-box;
}
:where([${attribute}][${matchAttribute}~="height"]) {
  height: var(--ae-anchor-target-height, 0px);
  box-sizing: border-box;
}
:where([${attribute}][${matchAttribute}].${anchoredClass}) {
  transform: translate3d(var(--ae-anchor-pivot-x), var(--ae-anchor-pivot-y), 0)
    translate(calc(0% - var(--ae-anchor-origin-x)), calc(0% - var(--ae-anchor-origin-y)));
}
:where([${attribute}].${switchingClass}) {
  transition-property: transform, width, height;
  transition-duration: var(--ae-anchor-switch-duration, 0ms);
  transition-timing-function: var(--ae-anchor-switch-ease, ease-in-out);
  transition-delay: 0s;
}
:where(html[${reducedMotionAttribute}="reduced"] [${attribute}].${switchingClass}) {
  transition: none;
}
`;
}
