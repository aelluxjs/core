/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Classic, independent Service Worker. Set self.AelluxPWAConfig before importScripts.
(function (worker) {
  "use strict";
  const config = worker.AelluxPWAConfig || {}, policy = config.cache || {};
  const scope = new URL(worker.registration.scope);
  const prefix = `aellux-pwa:${encodeURIComponent(scope.href)}:${encodeURIComponent(config.name || "app")}:`;
  const cacheName = prefix + encodeURIComponent(config.version || "1");
  const strategies = ["network-first", "cache-first", "stale-while-revalidate", "network-only"];
  function localURL(input) {
    const url = new URL(input, scope);
    if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname) || url.username || url.password || url.hash) {
      throw new TypeError("PWA cache URLs must belong to the application's origin and scope.");
    }
    return url;
  }
  const offline = config.offline ? localURL(config.offline).href : null;
  const precache = [...new Set([...(policy.precache || []), ...(offline ? [offline] : [])].map(input => localURL(input).href))];
  const paths = (policy.paths || []).map(input => localURL(input));
  for (const name of ["navigation", "assets"]) {
    if (policy[name] !== undefined && !strategies.includes(policy[name])) throw new TypeError(`Unknown PWA ${name} strategy.`);
  }
  function sensitive(url) {
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch (_) { return true; }
    return /\/(?:api|auth|login|logout|account|admin)(?:\/|$)/i.test(pathname) ||
      [...url.searchParams.keys()].some(key => /^(?:token|access_token|session|password|key)$/i.test(key));
  }
  function cacheableRequest(request) {
    const control = request.headers.get("Cache-Control") || "";
    return request.method === "GET" && !request.headers.has("Authorization") &&
      !request.headers.has("Range") && request.cache !== "no-store" && request.cache !== "no-cache" &&
      !/\b(?:no-store|no-cache|private)\b/i.test(control) &&
      (request.credentials === "omit" || policy.allowCredentials === true);
  }
  function cacheableResponse(response) {
    return response.ok && response.type !== "opaque" && !response.redirected &&
      !/\b(?:no-store|no-cache|private)\b/i.test(response.headers.get("Cache-Control") || "") &&
      !response.headers.has("Set-Cookie") && !/(?:\*|cookie|authorization)/i.test(response.headers.get("Vary") || "");
  }
  async function store(cache, request, response) {
    if (cacheableResponse(response)) {
      try { await cache.put(request, response.clone()); } catch (_) { /* Quota failure must not break online navigation. */ }
    } else {
      try { await cache.delete(request); } catch (_) { /* A failed cache must not discard the network response. */ }
    }
    return response;
  }
  worker.addEventListener("install", event => {
    if (!precache.length) return;
    event.waitUntil((async () => {
      const cache = await caches.open(cacheName);
      for (const url of precache) {
        if (sensitive(new URL(url))) throw new TypeError("Sensitive routes cannot be precached.");
        const request = new Request(url, { credentials: "omit", cache: "reload" });
        const response = await fetch(request);
        if (!cacheableResponse(response)) throw new Error(`Unsafe or unsuccessful precache response: ${url}`);
        await cache.put(request, response);
      }
    })());
  });
  worker.addEventListener("activate", event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys
      .filter(key => key.startsWith(prefix) && key !== cacheName).map(key => caches.delete(key)))));
  });
  worker.addEventListener("message", event => {
    if (event.data?.type === "AELLUX_PWA_SKIP_WAITING") event.waitUntil(worker.skipWaiting());
  });
  worker.addEventListener("fetch", event => {
    const request = event.request, url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname) || sensitive(url) ||
      request.headers.has("Authorization") || request.cache === "no-store") return;
    const navigation = request.mode === "navigate";
    const selected = precache.includes(url.href) || paths.some(path => path.search ? path.href === url.href :
      path.pathname.endsWith("/") ? url.pathname.startsWith(path.pathname) : url.pathname === path.pathname);
    const strategy = navigation ? policy.navigation : selected ? policy.assets : null;
    if (!strategy || strategy === "network-only") return;
    const eligible = cacheableRequest(request);
    if (!eligible && !(navigation && offline)) return;
    let background = Promise.resolve();
    const responseTask = (async () => {
      let cache = null, cached = null;
      try {
        cache = await caches.open(cacheName);
        if (eligible) cached = await cache.match(request);
      } catch (_) { /* Cache Storage can be disabled or evicted; keep the network usable. */ }
      const network = () => fetch(request).then(response => eligible && cache ? store(cache, request, response) : response);
      const fallback = async error => {
        let response = cached;
        if (!response && navigation && offline && cache) {
          try { response = await cache.match(offline); } catch (_) { /* Preserve the network failure. */ }
        }
        if (response) return response;
        throw error;
      };
      if (strategy === "cache-first" && cached) return cached;
      if (strategy === "stale-while-revalidate") {
        const task = network();
        background = task.catch(() => {});
        return cached || task.catch(fallback);
      }
      return network().catch(fallback);
    })();
    event.respondWith(responseTask);
    // Extend lifetime during dispatch, including when cache lookup fails.
    if (strategy === "stale-while-revalidate") event.waitUntil(responseTask.then(() => background, () => background));
  });
})(self);
