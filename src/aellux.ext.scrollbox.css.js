/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function generateScrollboxCSS(aelluxJs) {
  const scrollboxAttribute = aelluxJs.attr("scrollbox");
  const scrollboxElasticAttribute = aelluxJs.attr("scrollbox-elastic");
  const fadeStateAttribute = aelluxJs.attr("scrollbox-fade-state");
  const scrollboxSnapAttribute = aelluxJs.attr("scrollbox-snap");
  const snapReadyClass = aelluxJs.className("snap-ready");
  const snapSuspendedClass = aelluxJs.className("snap-suspended");
  const snapItemAttribute = aelluxJs.attr("snap-item");
  const pointerscrollingClass = aelluxJs.className("pointerscrolling");
  const nativeSbHideClass = aelluxJs.className("native-sb-hide");
  const scrollbarVerticalAttribute = aelluxJs.attr("scrollbar-vertical");
  const scrollbarHorizontalAttribute = aelluxJs.attr("scrollbar-horizontal");
  const scrollbarVisibleClass = aelluxJs.className("scrollbar-visible");
  const scrollbarWrapperClass = aelluxJs.className("scrollbar-wrapper");
  const verticalBar = `[${scrollbarVerticalAttribute}]`;
  const horizontalBar = `[${scrollbarHorizontalAttribute}]`;
  const bars = `${verticalBar}, ${horizontalBar}`;
  const reducedMotionAttribute = aelluxJs.attr("reduced-motion");

  return `/*! aellux.js Scrollbox Extension | SPDX-License-Identifier: Apache-2.0 */

:where([${scrollboxAttribute}]) {
  contain: layout paint;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, CanvasText 50%, transparent) transparent;
}

:where([${scrollboxAttribute}][${fadeStateAttribute}]) {
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
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

.${pointerscrollingClass},
.${pointerscrollingClass} :is(a, button)[draggable='false'],
.${pointerscrollingClass} :is(a, button)[draggable='false'] * {
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

:where(${bars}) {
  position: sticky;
  display: var(--ae-scrollbar-display, none);
  z-index: 10;
  background: var(--ae-scrollbar-track-color, transparent);
  opacity: var(--ae-scrollbar-opacity-fade, 0);
  touch-action: none;
  transition: opacity 160ms ease;
}

:where(${verticalBar}) {
  top: 0;
  left: calc(100% - var(--ae-scrollbar-size, 8px));
  width: var(--ae-scrollbar-size, 8px);
  height: var(--ae-scrollbar-length, 0px);
  margin-bottom: calc(-1 * var(--ae-scrollbar-length, 0px));
}

:where(${horizontalBar}) {
  left: 0;
  bottom: 0;
  width: var(--ae-scrollbar-length, 0px);
  height: var(--ae-scrollbar-size, 8px);
  margin-top: calc(-1 * var(--ae-scrollbar-size, 8px));
}

:where(${bars})::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  border-radius: var(--ae-scrollbar-thumb-radius, 10px);
  background: var(--ae-scrollbar-thumb-color, color-mix(in srgb, CanvasText 50%, transparent));
}

:where(${verticalBar})::before {
  width: 100%;
  height: var(--ae-scrollbar-thumb-size, 0px);
  transform: translate3d(0, var(--ae-scrollbar-thumb-position, 0px), 0);
}

:where(${horizontalBar})::before {
  width: var(--ae-scrollbar-thumb-size, 0px);
  height: 100%;
  transform: translate3d(var(--ae-scrollbar-thumb-position, 0px), 0, 0);
}

:where(${bars}):hover::before {
  background: var(--ae-scrollbar-thumb-hover-color, color-mix(in srgb, CanvasText 90%, transparent));
}

:where([${scrollboxAttribute}].${scrollbarVisibleClass}, [${scrollboxAttribute}].${pointerscrollingClass}) >
  :is([${scrollbarVerticalAttribute}], [${scrollbarHorizontalAttribute}]),
:where(.${scrollbarWrapperClass}.${scrollbarVisibleClass}) {
  opacity: var(--ae-scrollbar-opacity-visible, 1);
}

:where(.${scrollbarWrapperClass}) {
  position: absolute;
  left: var(--ae-scrollbar-x);
  top: var(--ae-scrollbar-y);
  bottom: auto;
  margin: 0;
}

:where([${scrollbarVerticalAttribute}].${scrollbarWrapperClass}) {
  left: calc(var(--ae-scrollbar-x) - var(--ae-scrollbar-size, 8px));
}

:where([${scrollbarHorizontalAttribute}].${scrollbarWrapperClass}) {
  top: calc(var(--ae-scrollbar-y) - var(--ae-scrollbar-size, 8px));
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
