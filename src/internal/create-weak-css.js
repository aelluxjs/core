/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export default function createWeakCss() {
  return `
:where(html) { color-scheme: light dark; }
:where(html[?color-scheme='dark']) { color-scheme: dark; }
:where(html[?color-scheme='light']) { color-scheme: light; }
:where(body,html) { font-family: system-ui; background-color: Canvas; color: CanvasText; }
:where(button,a[href],[role='button'],[role='tab']) { touch-action: manipulation; }
:where([?anchor]) { visibility: hidden; contain: layout paint; }
:where([?anchor].%anchored) {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate3d(var(--ae-anchor-x, 0px), var(--ae-anchor-y, 0px), 0);
  transform-origin: var(--ae-anchor-origin-x, 50%) var(--ae-anchor-origin-y, 0%);
  visibility: visible;
}
[?wait-mounted]:not(.%mounted) > *:not([?loader]) { visibility: hidden !important; }
[?wait-mounted].%mounted > [?loader] { display: none !important; }
:where([?scrollbox]) { contain:layout paint; overflow:clip; scrollbar-width: thin; scrollbar-color: #8886 transparent;}
:where([?scrollbox]::-webkit-scrollbar) { width: 8px; height: 8px;}
:where([?scrollbox]::-webkit-scrollbar-track) { background: transparent;}
:where([?scrollbox]::-webkit-scrollbar-thumb) { background: #8886; border-radius: 10px;}
:where([?scrollbox]::-webkit-scrollbar-thumb:hover) { background: #6666;}
`;
}
