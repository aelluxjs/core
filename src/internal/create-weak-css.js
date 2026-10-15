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
    }

    :where(*) {
      scroll-behavior: smooth;
    }

    @media (prefers-reduced-motion: reduce) {
      :where(*) {
        scroll-behavior: initial !important;
      }
    }

    :where(button, a[href], [role='button'], [role='tab']) {
      touch-action: manipulation;
      cursor: pointer;
    }

    :where([?anchor]) {
      visibility: hidden;
      pointer-events: none;
      position: absolute;
      contain: layout paint;
    }

    :where([?anchor].%anchored) {
      pointer-events: all;
      left: 0;
      top: 0;
      transform: translate3d(var(--ae-anchor-x, 0px), var(--ae-anchor-y, 0px), 0);
      transform-origin: var(--ae-anchor-origin-x, 50%) var(--ae-anchor-origin-y, 0%);
      visibility: visible;
    }

    [?wait-mounted]:not(.%mounted) > *:not([?loader]) {
      visibility: hidden !important;
    }

    [?wait-mounted].%mounted > [?loader] {
      display: none !important;
    }

    :where([?scrollbox]) {
      contain: layout paint;
      overflow: auto;
      scrollbar-width: thin;
      scrollbar-color: color-mix(in srgb, CanvasText 50%, transparent) transparent;
    }

    :where([?scrollbox-elastic], [?scrollbox-snap]) {
      display: inline-block;
      vertical-align: top;
    }

    .%pointerscrolling {
      cursor: grabbing !important;
    }

    .%pointerscrolling > [?scrollbox-elastic]:only-child:not([?scrollbox-elastic='false']),
    .%pointerscrolling > [?scrollbox-elastic]:only-child:not([?scrollbox-elastic='false']) * {
      pointer-events: none !important;
    }

    :where([?scrollbox]::-webkit-scrollbar) {
      width: 8px;
      height: 8px;
    }

    :where([?scrollbox]::-webkit-scrollbar-track) {
      background: transparent;
    }

    :where([?scrollbox]::-webkit-scrollbar-thumb) {
      background: color-mix(in srgb, CanvasText 50%, transparent);
      border-radius: 10px;
    }

    :where([?scrollbox]::-webkit-scrollbar-thumb:hover) {
      background: color-mix(in srgb, CanvasText 90%, transparent);
    }
  `.replace(/\s*([{};:,])\s*/g, "$1").replace(/;}/g, "}").trim();
}
