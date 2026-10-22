/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function generateScrollboxCSS(AelluxJs) {
  const scrollboxAttribute = AelluxJs.attr("scrollbox");
  const scrollboxElasticAttribute = AelluxJs.attr("scrollbox-elastic");
  const fadeStateAttribute = AelluxJs.attr("scrollbox-fade-state");
  const scrollboxSnapAttribute = AelluxJs.attr("scrollbox-snap");
  const snapReadyClass = AelluxJs.className("snap-ready");
  const snapSuspendedClass = AelluxJs.className("snap-suspended");
  const snapItemAttribute = AelluxJs.attr("snap-item");
  const pointerscrollingClass = AelluxJs.className("pointerscrolling");
  const nativeSbHideClass = AelluxJs.className("native-sb-hide");
  const scrollbarVerticalAttribute = AelluxJs.attr("scrollbar-vertical");
  const scrollbarHorizontalAttribute = AelluxJs.attr("scrollbar-horizontal");
  const scrollbarVisibleClass = AelluxJs.className("scrollbar-visible");
  const reducedMotionAttribute = AelluxJs.attr("reduced-motion");

  return `/*! aellux.js Scrollbox Extension | SPDX-License-Identifier: Apache-2.0 */

:where([${scrollboxAttribute}]) {
  contain: layout paint;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, CanvasText 50%, transparent) transparent;
}

:where([${scrollboxAttribute}][${fadeStateAttribute}]) {
  --ae-scrollbox-fade-length: max(0px, var(--ae-scrollbox-fade-size, 16px));
  --ae-scrollbox-fade-left: min(50%, var(--ae-scrollbox-fade-length), var(--ae-scrollbox-hidden-left));
  --ae-scrollbox-fade-right: min(50%, var(--ae-scrollbox-fade-length), var(--ae-scrollbox-hidden-right));
  --ae-scrollbox-fade-top: min(50%, var(--ae-scrollbox-fade-length), var(--ae-scrollbox-hidden-top));
  --ae-scrollbox-fade-bottom: min(50%, var(--ae-scrollbox-fade-length), var(--ae-scrollbox-hidden-bottom));
  --ae-scrollbox-mask-x: linear-gradient(to right,
    transparent calc(var(--ae-scrollbox-fade-left) - var(--ae-scrollbox-fade-length)),
    #000 var(--ae-scrollbox-fade-left), #000 calc(100% - var(--ae-scrollbox-fade-right)),
    transparent calc(100% + var(--ae-scrollbox-fade-length) - var(--ae-scrollbox-fade-right)));
  --ae-scrollbox-mask-y: linear-gradient(to bottom,
    transparent calc(var(--ae-scrollbox-fade-top) - var(--ae-scrollbox-fade-length)),
    #000 var(--ae-scrollbox-fade-top), #000 calc(100% - var(--ae-scrollbox-fade-bottom)),
    transparent calc(100% + var(--ae-scrollbox-fade-length) - var(--ae-scrollbox-fade-bottom)));
}
:where([${scrollboxAttribute}][${fadeStateAttribute}="both"]) {
  -webkit-mask-image: var(--ae-scrollbox-mask-x), var(--ae-scrollbox-mask-y);
  -webkit-mask-composite: source-in;
  mask-image: var(--ae-scrollbox-mask-x), var(--ae-scrollbox-mask-y);
  mask-composite: intersect;
}
:where([${scrollboxAttribute}][${fadeStateAttribute}="x"]) {
  -webkit-mask-image: var(--ae-scrollbox-mask-x);
  mask-image: var(--ae-scrollbox-mask-x);
}
:where([${scrollboxAttribute}][${fadeStateAttribute}="y"]) {
  -webkit-mask-image: var(--ae-scrollbox-mask-y);
  mask-image: var(--ae-scrollbox-mask-y);
}

:where([${scrollboxElasticAttribute}]) {
  display: inline-block;
  vertical-align: top;
}

:where([${scrollboxAttribute}][${scrollboxSnapAttribute}].${snapReadyClass}) {
  scroll-snap-type: x mandatory !important;
  scroll-behavior: auto !important;
}

:where([${scrollboxAttribute}][${scrollboxSnapAttribute}='vertical'].${snapReadyClass}) {
  scroll-snap-type: y mandatory !important;
}

:where([${scrollboxAttribute}][${scrollboxSnapAttribute}].${snapReadyClass}.${snapSuspendedClass}) {
  scroll-snap-type: none !important;
}

:where([${scrollboxAttribute}][${scrollboxSnapAttribute}].${snapReadyClass} [${snapItemAttribute}]) {
  scroll-snap-align: center !important;
  scroll-snap-stop: always;
}

:where([${scrollboxAttribute}][${scrollboxSnapAttribute}].${snapReadyClass} [${snapItemAttribute}='start']),
:where([${scrollboxAttribute}][${scrollboxSnapAttribute}].${snapReadyClass} [${snapItemAttribute}='left']),
:where([${scrollboxAttribute}][${scrollboxSnapAttribute}].${snapReadyClass} [${snapItemAttribute}='top']) {
  scroll-snap-align: start !important;
}

:where([${scrollboxAttribute}][${scrollboxSnapAttribute}].${snapReadyClass} [${snapItemAttribute}='end']),
:where([${scrollboxAttribute}][${scrollboxSnapAttribute}].${snapReadyClass} [${snapItemAttribute}='right']),
:where([${scrollboxAttribute}][${scrollboxSnapAttribute}].${snapReadyClass} [${snapItemAttribute}='bottom']) {
  scroll-snap-align: end !important;
}

.${pointerscrollingClass} {
  cursor: grabbing !important;
}

.${pointerscrollingClass} > [${scrollboxElasticAttribute}]:not([${scrollboxElasticAttribute}='false']),
.${pointerscrollingClass} > [${scrollboxElasticAttribute}]:not([${scrollboxElasticAttribute}='false']) * {
  pointer-events: none !important;
}

[${scrollboxAttribute}].${nativeSbHideClass} {
  scrollbar-width: none !important;
}

[${scrollboxAttribute}].${nativeSbHideClass}::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

:where([${scrollboxAttribute}] > [${scrollbarVerticalAttribute}], [${scrollboxAttribute}] > [${scrollbarHorizontalAttribute}]) {
  position: sticky;
  display: var(--ae-scrollbar-display, none);
  z-index: 10;
  background: var(--ae-scrollbar-track-color, transparent);
  opacity: var(--ae-scrollbar-opacity-fade, 0);
  touch-action: none;
  transition: opacity 160ms ease;
}

:where([${scrollboxAttribute}] > [${scrollbarVerticalAttribute}]) {
  top: 0;
  left: calc(100% - var(--ae-scrollbar-size, 8px));
  width: var(--ae-scrollbar-size, 8px);
  height: var(--ae-scrollbar-length, 0px);
  margin-bottom: calc(-1 * var(--ae-scrollbar-length, 0px));
}

:where([${scrollboxAttribute}] > [${scrollbarHorizontalAttribute}]) {
  left: 0;
  bottom: 0;
  width: var(--ae-scrollbar-length, 0px);
  height: var(--ae-scrollbar-size, 8px);
  margin-top: calc(-1 * var(--ae-scrollbar-size, 8px));
}

:where([${scrollboxAttribute}] > [${scrollbarVerticalAttribute}], [${scrollboxAttribute}] > [${scrollbarHorizontalAttribute}])::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  border-radius: var(--ae-scrollbar-thumb-radius, 10px);
  background: var(--ae-scrollbar-thumb-color, color-mix(in srgb, CanvasText 50%, transparent));
}

:where([${scrollboxAttribute}] > [${scrollbarVerticalAttribute}])::before {
  width: 100%;
  height: var(--ae-scrollbar-thumb-size, 0px);
  transform: translate3d(0, var(--ae-scrollbar-thumb-position, 0px), 0);
}

:where([${scrollboxAttribute}] > [${scrollbarHorizontalAttribute}])::before {
  width: var(--ae-scrollbar-thumb-size, 0px);
  height: 100%;
  transform: translate3d(var(--ae-scrollbar-thumb-position, 0px), 0, 0);
}

:where([${scrollboxAttribute}] > [${scrollbarVerticalAttribute}], [${scrollboxAttribute}] > [${scrollbarHorizontalAttribute}]):hover::before {
  background: var(--ae-scrollbar-thumb-hover-color, color-mix(in srgb, CanvasText 90%, transparent));
}

:where([${scrollboxAttribute}].${scrollbarVisibleClass}, [${scrollboxAttribute}].${pointerscrollingClass}) >
  :is([${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]) {
  opacity: var(--ae-scrollbar-opacity-visible, 1);
}

html[${reducedMotionAttribute}='reduced'] *[${scrollbarVerticalAttribute}],
html[${reducedMotionAttribute}='reduced'] *[${scrollbarHorizontalAttribute}] {
  transition: none;
}

:where([${scrollboxAttribute}]::-webkit-scrollbar) {
  width: var(--ae-scrollbar-size, 8px);
  height: var(--ae-scrollbar-size, 8px);
}

:where([${scrollboxAttribute}]::-webkit-scrollbar-track) {
  background: var(--ae-scrollbar-track-color, transparent);
}

:where([${scrollboxAttribute}]::-webkit-scrollbar-thumb) {
  background: var(--ae-scrollbar-thumb-color, color-mix(in srgb, CanvasText 50%, transparent));
  border-radius: var(--ae-scrollbar-thumb-radius, 10px);
}

:where([${scrollboxAttribute}]::-webkit-scrollbar-thumb:hover) {
  background: var(--ae-scrollbar-thumb-hover-color, color-mix(in srgb, CanvasText 90%, transparent));
}
`;
}
