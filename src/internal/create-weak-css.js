/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export default function createWeakCss() {
  return `
    :where(html) {
      color-scheme: light dark;
    }

    :where(html[?color-scheme='dark']) {
      color-scheme: dark;
    }

    :where(html[?color-scheme='light']) {
      color-scheme: light;
    }

    :where(body, html) {
      font-family: system-ui;
      background-color: Canvas;
      color: CanvasText;
      margin: 0;
    }

    :where(*) {
      scroll-behavior: smooth;
    }

    :where(html[?reduced-motion='reduced'],
    html[?reduced-motion='reduced'] *) {
      scroll-behavior: initial !important;
    }

    :where([draggable='true']){
      cursor: grab;
    }

    :where(button, a[href], [role='button'], [role='tab']) {
      user-select: none;
      touch-action: manipulation;
      cursor: pointer;
    }

    [?wait-mounted]:not(.%mounted) {
      cursor: wait!important;
    }

    [?wait-mounted]:not(.%mounted) > *:not([?loader]) {
      visibility: hidden !important;
    }

    [?wait-mounted].%mounted > [?loader] {
      display: none !important;
    }

  `.replace(/\s*([{};:,])\s*/g, "$1").replace(/;}/g, "}").trim();
}
