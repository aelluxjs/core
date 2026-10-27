import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = async path => readFile(new URL(`../../${path}`, import.meta.url), "utf8");
const stateSource = await source("src/aellux.ext.state-navigation.js");
const runtimeSource = (await source("src/aellux.orchestrator.js")).replace(/^import .*;\r?\n/gm, "");
const viewportSource = await source("src/aellux.ext.viewport.js");
const themeSource = await source("templates/docweaver/js/main.js");
const tocSource = await source("templates/docweaver/js/toc-init.js");
const settle = () => new Promise(resolve => setImmediate(resolve));

function apiStub() {
  const events = [], handlers = {}, diagnostics = [];
  const api = {
    options: {}, attr: name => `data-ae-${name}`, eventName: name => name,
    extAttach(name, extension) { this.extension = extension; },
    dispatch: (name, options) => events.push({ name, ...options }),
    on: (name, handler) => { handlers[name] = handler; },
    off: name => { delete handlers[name]; },
    onEvent: (target, name, handler) => { handlers[name] = handler; },
    diagnostics: { warn() {}, error: (definition, context) => diagnostics.push(context) }
  };
  return { api, events, handlers, diagnostics };
}

test("PushState reports async failure without escaping, while setState preserves rejection", async () => {
  const { api, events, handlers, diagnostics } = apiStub();
  const error = new Error("History denied");
  runInNewContext(stateSource, { AelluxJs: api, URLSearchParams,
    window: { location: { hash: "" } }, document: { title: "Test" },
    history: { replaceState() {}, pushState() { throw error; } } });
  api.extension.init({});
  handlers.PushState({ detail: { key: "panel", value: "open" } });
  await settle();
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0].cause, error);
  assert.equal(events.filter(e => e.name === "SnapshotChange").length, 0);
  const event = events.find(e => e.name === "StateNavigationError");
  assert.equal(event.detail.error, error);
  assert.equal(event.detail.key, "panel");
  await assert.rejects(api.extension.setState("panel", "closed"), e => e === error);
  assert.equal(events.filter(e => e.name === "StateNavigationError").length, 2);
});

for (const readyState of ["loading", "complete"]) {
  for (const synchronous of [false, true]) {
    test(`startup forwards mount failure (${readyState}, sync=${synchronous})`, async () => {
      const { api, events, handlers } = apiStub();
      const error = new Error("Mount failed");
      Object.assign(api, { version: "0.1.0-beta.10", shortJSName: "$ae" });
      runInNewContext(runtimeSource, { AelluxJs: api, document: { readyState },
        utilsNameCase: {}, buildMountMapManager: () => ({ mount() {
          if (synchronous) throw error;
          return Promise.reject(error);
        } }), buildLayoutScheduler: () => ({}), createAriaHelper: () => ({}),
        createCssMotionController: () => ({}), ease() {} });
      const task = api.startAelluxJs();
      const rejected = assert.rejects(task, e => e === error);
      if (readyState === "loading") handlers.$DOMContentLoaded();
      await rejected;
      assert.equal(handlers.$DOMContentLoaded, undefined);
      assert.equal(events.length, 1);
      assert.equal(events[0].name, "RuntimeStartError");
      assert.equal(events[0].detail.error, error);
    });
  }
}

test("Viewport reports observer failures, preserves update rejection and recovers on the next resize", async () => {
  const { api, events, handlers, diagnostics } = apiStub();
  let map, failure = null, reads = 0;
  api.mountManager = { add(value) { map = value; } };
  api.registerCssProperty = () => {};
  api.waitLayout = { read() {
    reads++;
    return failure ? Promise.reject(failure) : Promise.resolve(null);
  } };
  runInNewContext(viewportSource, { AelluxJs: api, document: {}, performance: { now: () => 0 } });
  api.extension.init();
  const element = {};
  await map.mount(element);
  failure = new Error("Layout failed");
  handlers.$resize();
  await settle();
  assert.equal(events.length, 1);
  assert.equal(events[0].name, "ViewportError");
  assert.equal(events[0].detail.error, failure);
  assert.equal(events[0].detail.elements[0], element);
  assert.equal(diagnostics[0].cause, failure);
  await assert.rejects(map.update(element), e => e === failure);
  failure = null;
  handlers.$resize();
  await settle();
  assert.equal(reads, 4);
  assert.equal(events.length, 2);
});

test("Viewport cleanup does not block a pending mount and reports its later rejection", async () => {
  const { api, events, diagnostics } = apiStub();
  let map, rejectCleanup;
  const cleanup = new Promise((resolve, reject) => { rejectCleanup = reject; });
  api.mountManager = { add(value) { map = value; }, unmount: () => cleanup };
  api.registerCssProperty = () => {};
  api.waitLayout = { read: (id, callback) => Promise.resolve(callback()),
    update: (id, callback) => Promise.resolve(callback()) };
  runInNewContext(viewportSource, { AelluxJs: api, document: {}, performance: { now: () => 0 } });
  api.extension.init();
  const element = { isConnected: true, hasAttribute: () => false };
  await map.mount(element);
  const error = new Error("Cleanup failed");
  rejectCleanup(error);
  await settle();
  assert.equal(events.length, 1);
  assert.equal(events[0].detail.operation, "unmount");
  assert.equal(events[0].detail.error, error);
  assert.equal(events[0].detail.elements[0], element);
  assert.equal(diagnostics[0].cause, error);
});

test("Docweaver reports initial TOC and BeforeMount enhancement failures", async () => {
  const { api, events, handlers } = apiStub();
  const tocError = new Error("TOC failed"), highlightError = new Error("Highlight failed");
  const stylesheet = { removeAttribute() {}, setAttribute() {} };
  const window = { hljs: { highlightElement() { throw highlightError; } } };
  const document = { currentScript: { src: "https://app.test/main.js" }, readyState: "complete",
    documentElement: { getAttribute: () => "light" }, addEventListener() {},
    querySelector: () => stylesheet,
    querySelectorAll: selector => selector === 'pre code:not([data-highlighted])' ? [{}] : [] };
  api.dep = () => Promise.resolve();
  api.init = () => {};
  const initOrRefreshToc = async () => { throw tocError; };
  window.initOrRefreshToc = initOrRefreshToc;
  runInNewContext(themeSource, { AelluxJs: api, window, document, URL, initOrRefreshToc,
    console: { error() {} } });
  await settle();
  assert.equal(events.length, 1);
  assert.equal(events[0].detail.error, tocError);
  handlers.BeforeMount({});
  await settle();
  assert.equal(events.length, 3);
  assert.ok(events.every(e => e.name === "DocweaverError"));
  assert.equal(events.find(e => e.detail.operation === "highlight").detail.error, highlightError);
});

test("TOC initialization tolerates no active link", async () => {
  const toc = { init(options) { this._options = options; } };
  const context = { window: { tocbot: toc }, tocbot: toc,
    document: { getElementById: () => null,
      querySelector: selector => selector === ".js-toc-content h1, h2, h3, h4" ? {} : null } };
  await runInNewContext(`${tocSource}\ninitOrRefreshToc();`, context);
});
