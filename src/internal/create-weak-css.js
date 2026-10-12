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
`;
}
