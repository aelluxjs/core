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

    :where([?scrollbox-elastic]) {
      display: inline-block;
      vertical-align: top;
    }

    :where([?scrollbox][?scrollbox-snap].%snap-ready) {
      scroll-snap-type: x mandatory !important;
    }

    :where([?scrollbox][?scrollbox-snap='vertical'].%snap-ready) {
      scroll-snap-type: y mandatory !important;
    }

    :where([?scrollbox][?scrollbox-snap].%snap-ready.%snap-suspended) {
      scroll-snap-type: none !important;
    }

    :where([?scrollbox][?scrollbox-snap].%snap-ready [?snap-item]) {
      scroll-snap-align: center !important;
    }

    :where([?scrollbox][?scrollbox-snap].%snap-ready [?snap-item='start']),
    :where([?scrollbox][?scrollbox-snap].%snap-ready [?snap-item='left']),
    :where([?scrollbox][?scrollbox-snap].%snap-ready [?snap-item='top']) {
      scroll-snap-align: start !important;
    }

    :where([?scrollbox][?scrollbox-snap].%snap-ready [?snap-item='end']),
    :where([?scrollbox][?scrollbox-snap].%snap-ready [?snap-item='right']),
    :where([?scrollbox][?scrollbox-snap].%snap-ready [?snap-item='bottom']) {
      scroll-snap-align: end !important;
    }

    .%pointerscrolling {
      cursor: grabbing !important;
    }

    .%pointerscrolling > [?scrollbox-elastic]:not([?scrollbox-elastic='false']),
    .%pointerscrolling > [?scrollbox-elastic]:not([?scrollbox-elastic='false']) * {
      pointer-events: none !important;
    }

    [?scrollbox].%native-sb-hide {
      scrollbar-width: none !important;
    }

    [?scrollbox].%native-sb-hide::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }

    :where([?scrollbox] > [?scrollbar-vertical], [?scrollbox] > [?scrollbar-horizontal]) {
      position: absolute;
      display: var(--ae-scrollbar-display, none);
      left: 0;
      top: 0;
      z-index: 10;
      background: var(--ae-scrollbar-track-color, transparent);
      opacity: 0;
      touch-action: none;
      transform: translate3d(var(--ae-scrollbar-x, 0px), var(--ae-scrollbar-y, 0px), 0);
      transition: opacity 160ms ease;
    }

    :where([?scrollbox] > [?scrollbar-vertical]) {
      width: 8px;
      height: var(--ae-scrollbar-length, 0px);
    }

    :where([?scrollbox] > [?scrollbar-horizontal]) {
      width: var(--ae-scrollbar-length, 0px);
      height: 8px;
    }

    :where([?scrollbox] > [?scrollbar-vertical], [?scrollbox] > [?scrollbar-horizontal])::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      border-radius: 10px;
      background: var(--ae-scrollbar-thumb-color, color-mix(in srgb, CanvasText 50%, transparent));
    }

    :where([?scrollbox] > [?scrollbar-vertical])::before {
      width: 100%;
      height: var(--ae-scrollbar-thumb-size, 0px);
      transform: translate3d(0, var(--ae-scrollbar-thumb-position, 0px), 0);
    }

    :where([?scrollbox] > [?scrollbar-horizontal])::before {
      width: var(--ae-scrollbar-thumb-size, 0px);
      height: 100%;
      transform: translate3d(var(--ae-scrollbar-thumb-position, 0px), 0, 0);
    }

    :where([?scrollbox] > [?scrollbar-vertical], [?scrollbox] > [?scrollbar-horizontal]):hover::before {
      background: var(--ae-scrollbar-thumb-hover-color, color-mix(in srgb, CanvasText 90%, transparent));
    }

    :where([?scrollbox].%scrollbar-visible, [?scrollbox].%pointerscrolling) >
      :is([?scrollbar-vertical], [?scrollbar-horizontal]) {
      opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      :where([?scrollbox] > [?scrollbar-vertical], [?scrollbox] > [?scrollbar-horizontal]) {
        transition: none;
      }
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
