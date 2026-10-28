import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../../src/aellux.pwa.sw.js", import.meta.url), "utf8");
const base = "https://app.test/sub/";
function setup(config = {}, storage = new Map(), disabledCache = false) {
  const handlers = {}, calls = [];
  let online = true, responseHeaders = {}, counter = 0, skipped = 0;
  const caches = { keys: async () => [...storage.keys()], delete: async key => storage.delete(key), open: async key => {
    if (disabledCache) throw new Error("Cache Storage disabled");
    if (!storage.has(key)) storage.set(key, new Map());
    const entries = storage.get(key);
    return { match: async request => entries.get(typeof request === "string" ? request : request.url)?.clone(),
      delete: async request => entries.delete(typeof request === "string" ? request : request.url),
      put: async (request, response) => entries.set(typeof request === "string" ? request : request.url, response.clone()) };
  } };
  const worker = { registration: { scope: base }, AelluxPWAConfig: config,
    addEventListener: (name, callback) => { handlers[name] = callback; }, skipWaiting: async () => { skipped++; } };
  runInNewContext(source, { self: worker, caches, URL, Request, Response, Set, Promise, TypeError, Error,
    fetch: async request => { calls.push(request); if (!online) throw new Error("offline"); return new Response(`network-${++counter}`, { headers: responseHeaders }); } });
  async function dispatch(name, options = {}) {
    const pending = [];
    let result;
    handlers[name]({ ...options, waitUntil: value => pending.push(value), respondWith: value => { result = value; } });
    const response = result ? await result : null;
    await Promise.all(pending);
    return response;
  }
  function request(path, options = {}) { return new Request(new URL(path, base), { credentials: "omit", ...options }); }
  return { storage, calls, dispatch, request, skipped: () => skipped,
    offline: () => { online = false; }, headers: value => { responseHeaders = value; } };
}

for (const strategy of ["cache-first", "network-first", "stale-while-revalidate", "network-only"]) {
  test(`worker ${strategy} and configured paths`, async () => {
    const sw = setup({ cache: { assets: strategy, paths: ["assets/"] } });
    const req = sw.request("assets/app.js");
    const first = await sw.dispatch("fetch", { request: req });
    if (strategy === "network-only") { assert.equal(first, null); assert.equal(sw.storage.size, 0); return; }
    assert.equal(await first.text(), "network-1");
    const second = await sw.dispatch("fetch", { request: req });
    assert.equal(await second.text(), strategy === "network-first" ? "network-2" : "network-1");
    sw.offline();
    assert.ok(await sw.dispatch("fetch", { request: req }));
    assert.equal(await sw.dispatch("fetch", { request: sw.request("elsewhere.js") }), null);
  });
}

test("worker defaults to no interception and never skips waiting implicitly", async () => {
  const sw = setup();
  assert.equal(await sw.dispatch("fetch", { request: sw.request("assets/app.js") }), null);
  await sw.dispatch("install");
  await sw.dispatch("activate");
  assert.equal(sw.storage.size, 0);
  assert.equal(sw.skipped(), 0);
  await sw.dispatch("message", { data: { type: "AELLUX_PWA_SKIP_WAITING" } });
  assert.equal(sw.skipped(), 1);
});

test("worker does not cache credentialed, non-GET, sensitive, cross-origin, range or no-store requests", async () => {
  const sw = setup({ cache: { assets: "cache-first", paths: ["./"] } });
  for (const req of [sw.request("assets/a.js", { credentials: "include" }), sw.request("api/me"), sw.request("account"),
    sw.request("assets/a.js?token=secret"), sw.request("assets/a.js?%74oken=secret"), sw.request("%61pi/me"),
    sw.request("assets/a.js", { method: "POST" }), sw.request("https://other.test/sub/a.js"),
    sw.request("assets/a.js", { headers: { Authorization: "Bearer secret" } }), sw.request("assets/a.js", { cache: "no-store" }),
    sw.request("assets/a.js", { headers: { Range: "bytes=0-1" } })]) {
    assert.equal(await sw.dispatch("fetch", { request: req }), null, req.url);
  }
  assert.equal(sw.storage.size, 0);
});

test("worker refuses private/no-store/no-cache and identity-varying responses", async () => {
  for (const headers of [{ "Cache-Control": "private" }, { "Cache-Control": "no-store" }, { "Cache-Control": "no-cache" },
    { Vary: "Cookie" }, { Vary: "Authorization" }, { Vary: "*" }, { "Set-Cookie": "identity=1" }]) {
    const sw = setup({ cache: { assets: "cache-first", paths: ["assets/"] } });
    sw.headers(headers);
    await sw.dispatch("fetch", { request: sw.request("assets/a.js") });
    assert.equal([...sw.storage.values()][0].size, 0);
  }
});

test("a response that becomes private evicts its previous public cache entry", async () => {
  const sw = setup({ cache: { assets: "network-first", paths: ["assets/"] } });
  const request = sw.request("assets/a.js");
  await sw.dispatch("fetch", { request });
  assert.equal([...sw.storage.values()][0].size, 1);
  sw.headers({ "Cache-Control": "private" });
  await sw.dispatch("fetch", { request });
  assert.equal([...sw.storage.values()][0].size, 0);
});

test("disabled Cache Storage preserves online network responses", async () => {
  const sw = setup({ cache: { assets: "cache-first", paths: ["assets/"] } }, new Map(), true);
  const response = await sw.dispatch("fetch", { request: sw.request("assets/a.js") });
  assert.equal(await response.text(), "network-1");
});

test("configured precache supplies offline navigation without caching credentialed pages", async () => {
  const sw = setup({ offline: "offline.html", cache: { navigation: "network-first", precache: ["shell.html"] } });
  await sw.dispatch("install");
  assert.equal(sw.calls.every(req => req.credentials === "omit"), true);
  sw.offline();
  const req = { url: base + "page", mode: "navigate", credentials: "include", method: "GET", headers: new Headers(), cache: "default" };
  assert.match(await (await sw.dispatch("fetch", { request: req })).text(), /network/);
  assert.equal([...sw.storage.values()][0].has(req.url), false);
});

test("activation deletes only older caches of the same application and scope", async () => {
  const storage = new Map(), old = setup({ name: "app", version: "1", cache: { precache: ["a.js"] } }, storage);
  await old.dispatch("install");
  storage.set("foreign-cache", new Map());
  const other = setup({ name: "other", version: "1", cache: { precache: ["b.js"] } }, storage);
  await other.dispatch("install");
  const current = setup({ name: "app", version: "2", cache: { precache: ["a.js"] } }, storage);
  await current.dispatch("install");
  await current.dispatch("activate");
  assert.equal(storage.size, 3);
  assert.ok([...storage.keys()].some(key => key.endsWith(":other:1")));
  assert.equal([...storage.keys()].some(key => key.endsWith(":app:1")), false);
});

test("worker rejects cross-origin/out-of-scope cache configuration and unsafe precache", async () => {
  for (const input of ["https://other.test/file", "/outside/file"]) assert.throws(() => setup({ cache: { precache: [input] } }), /origin and scope/);
  assert.throws(() => setup({ cache: { assets: "invalid" } }), /Unknown/);
  const sw = setup({ cache: { precache: ["a.js"] } });
  sw.headers({ "Cache-Control": "private" });
  await assert.rejects(sw.dispatch("install"), /Unsafe/);
});
