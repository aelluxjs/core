/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

/*
 * Aellux Extension compatibility contract:
 * - Keep this source ES2017-compatible and publish it as a classic script named
 *   aellux.ext.<name>.js. Do not expose ESM imports or exports in the final file.
 * - To support the Legacy runtime, transpile this same source to ES5 and publish
 *   aellux.ext.<name>.legacy.js with the same extensionName, API, and lifecycle.
 * - Reference build: node build-extension.mjs ./aellux.ext.<name>.js ./dist
 * - The Legacy Core provides core-js/stable language APIs, fetch, CustomEvent,
 *   requestAnimationFrame/cancelAnimationFrame, MutationObserver,
 *   IntersectionObserver, ResizeObserver, Element.matches, and NodeList.forEach.
 * - Feature-detect and bundle any other required polyfill with the Extension.
 *   DOMParser, WebSocket, Web Components, Canvas APIs, Intl data, and application
 *   dependencies are not guaranteed by the Core.
 * - Declare available artifacts with builds: ["modern"], ["legacy"], or
 *   ["modern", "legacy"] when registering the Extension through $ae.ext().
 */

(function () {
  "use strict";

  const extensionName = "template";
  const attr = {
    extensionName: Aellux.attr(extensionName)
  };
  const mountMap = new Map();

  Aellux.extRegister(extensionName, { init, destroy, mountMap });

  function init() {
    mountMap.set(`[${attr.extensionName}]`, {
      mount: mountElement,
      unmount: unmountElement
    });
  }

  function destroy() {
    mountMap.clear();
  }

  function mountElement(element) {
  }

  function unmountElement(element) {
  }
})();
