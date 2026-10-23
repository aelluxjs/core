import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const source = await readFile(new URL("../../src/aellux.ext.pwa.js", import.meta.url), "utf8");
function setup({ navigator = {}, secure = true } = {}) {
  const root = new EventTarget(), events = [], maps = new Map();
  let extension;
  Object.assign(root, { navigator, isSecureContext: secure, location: new URL("https://app.test/sub/"),
    document: { baseURI: "https://app.test/sub/", querySelector: () => null },
    AelluxJs: { attr: name => `data-ae-${name}`, eventName: name => name.startsWith("$") ? name.slice(1) : `Demo${name}`,
      extAttach: (_, value) => { extension = value; },
      onEvent: (target, event, fn) => target.addEventListener(event.slice(1), fn),
      offEvent: (target, event, fn) => target.removeEventListener(event.slice(1), fn),
      dispatchFrom: (element, name, options) => events.push({ element, name, ...options }),
      mountManager: { add: value => maps.set(value.extensionName, value), remove: ({ extensionName }) => maps.delete(extensionName) }
    } });
  runInNewContext(source, { globalThis: root, URL, Promise, Set, Map, Error, TypeError });
  extension.init();
  return { root, extension, events, maps };
}
function prompt(root, outcome = "accepted", callback = () => {}) {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  let calls = 0;
  event.prompt = () => { calls++; callback(); return Promise.resolve({ outcome }); };
  event.userChoice = Promise.resolve({ outcome });
  root.dispatchEvent(event);
  return { event, calls: () => calls };
}

test("native prompt runs synchronously once, shares pending result, emits normalized events and clears references", async () => {
  const { root, extension, events } = setup();
  let inStack = true;
  const native = prompt(root, "accepted", () => assert.equal(inStack, true));
  assert.equal(native.event.defaultPrevented, true);
  assert.equal(extension.status().canPrompt, true);
  const task = extension.install();
  assert.equal(extension.install(), task);
  assert.equal(native.calls(), 1);
  inStack = false;
  assert.equal((await task).outcome, "accepted");
  assert.equal(extension.status().canPrompt, false);
  // Acceptance is not confirmation of installation.
  assert.equal(extension.status().installed, null);
  root.dispatchEvent(new Event("appinstalled"));
  root.dispatchEvent(new Event("appinstalled"));
  assert.equal(extension.status().installed, true);
  assert.deepEqual(events.map(event => event.name), ["DemoPwaInstallAvailable", "DemoPwaInstallRequested", "DemoPwaInstallAccepted", "DemoPwaInstalled"]);
});

test("dismissal and native errors release the event for a future prompt", async () => {
  const { root, extension, events } = setup();
  prompt(root, "dismissed");
  assert.equal((await extension.install()).outcome, "dismissed");
  assert.ok(events.some(event => event.name === "DemoPwaInstallDismissed"));
  prompt(root, "accepted", () => { throw new Error("denied"); });
  await assert.rejects(extension.install(), /denied/);
  assert.equal(extension.status().canPrompt, false);
  prompt(root);
  assert.equal((await extension.install()).outcome, "accepted");
});

test("unknown is not manual or false-installed; insecure is unavailable; iPadOS and standalone use positive signals", async () => {
  const unknown = setup().extension;
  assert.equal(unknown.status().installMethod, "unknown");
  assert.equal(unknown.status().installed, null);
  assert.equal(unknown.status().serviceWorker, "unavailable");
  assert.equal((await unknown.install()).outcome, "unknown");
  assert.equal(setup({ secure: false }).extension.status().installMethod, "unavailable");
  const ipad = setup({ navigator: { userAgent: "Mozilla/5.0 (Macintosh) Version/18.0 Safari/605.1", maxTouchPoints: 5 } }).extension;
  assert.equal(ipad.status().installMethod, "manual");
  assert.equal((await ipad.install({ fallback: "none" })).outcome, "manual");
  let context;
  await ipad.install({ fallback: value => { context = value; } });
  assert.equal(context.status.platform, "ios");
  assert.equal(setup({ navigator: { standalone: true } }).extension.status().installed, true);
  const embedded = setup({ navigator: { userAgent: "Mozilla/5.0 (iPhone) AppleWebKit/605.1 Mobile/15E Safari/605.1" } }).extension;
  assert.equal(embedded.status().installMethod, "unknown");
});

test("display-mode changes provide a positive installed signal and are cleaned up on destroy", () => {
  const { root, extension, events } = setup();
  const media = Object.assign(new EventTarget(), { matches: false });
  extension.destroy();
  root.matchMedia = query => { assert.equal(query, "(display-mode: standalone)"); return media; };
  extension.init();
  media.matches = true;
  media.dispatchEvent(new Event("change"));
  assert.equal(extension.status().installed, true);
  assert.equal(events.filter(event => event.name === "DemoPwaInstalled").length, 1);
  extension.destroy();
  const count = events.length;
  media.dispatchEvent(new Event("change"));
  assert.equal(events.length, count);
});

test("register validates origin, scope and options, deduplicates work, and destroy retains persistent workers", async () => {
  let registrations = 0, updates = 0, unregisters = 0;
  const value = Object.assign(new EventTarget(), { scope: "https://app.test/sub/", update: async () => { updates++; }, unregister: () => { unregisters++; } });
  const container = Object.assign(new EventTarget(), { register: async (script, options) => {
    registrations++;
    assert.equal(script, "https://app.test/sub/sw.js");
    assert.equal(options.scope, "https://app.test/sub/");
    return value;
  } });
  const { extension, events } = setup({ navigator: { serviceWorker: container } });
  for (const options of [{ script: "https://other.test/sw.js" }, { script: "sw.js", scope: "https://other.test/" },
    { script: "sw.js", type: "invalid" }, { script: "sw.js", updateViaCache: "invalid" }, { script: "sw.js#fragment" }, {}]) {
    await assert.rejects(extension.register(options));
  }
  const first = extension.register({ script: "sw.js", scope: "./" });
  assert.equal(extension.register({ script: "sw.js", scope: "./" }), first);
  await first;
  await extension.register({ script: "sw.js", scope: "./" });
  assert.equal(registrations, 1);
  value.active = { scriptURL: "https://app.test/sub/sw.js" };
  let messages = 0;
  value.waiting = { postMessage: () => messages++ };
  value.dispatchEvent(new Event("updatefound"));
  value.dispatchEvent(new Event("updatefound"));
  assert.equal(events.filter(event => event.name === "DemoPwaUpdateAvailable").length, 1);
  assert.equal(messages, 0);
  assert.equal(extension.applyUpdate(), true);
  assert.equal(messages, 1);
  await extension.checkUpdate();
  assert.equal(updates, 1);
  extension.destroy();
  assert.equal(unregisters, 0);
  const count = events.length;
  value.dispatchEvent(new Event("updatefound"));
  container.dispatchEvent(new Event("controllerchange"));
  assert.equal(events.length, count);
});

test("destroy invalidates pending registration and prompt completion, init can run again", async () => {
  let finish, calls = 0;
  const container = Object.assign(new EventTarget(), { register: () => {
    calls++;
    return new Promise(resolve => { finish = resolve; });
  } });
  const { extension, root, events } = setup({ navigator: { serviceWorker: container } });
  const task = extension.register({ script: "sw.js" });
  await Promise.resolve();
  extension.destroy();
  finish(new EventTarget());
  await task;
  assert.equal(calls, 1);
  assert.equal(events.some(event => event.name === "DemoPwaWorkerRegistered"), false);
  extension.init();
  prompt(root);
  const installing = extension.install();
  extension.destroy();
  await installing;
  assert.equal(events.some(event => event.name === "DemoPwaInstallAccepted"), false);
});

test("normal worker replacement is not an update failure; failed installation reports an error", async () => {
  const registration = Object.assign(new EventTarget(), { active: { scriptURL: "https://app.test/sub/sw.js" } });
  const container = Object.assign(new EventTarget(), { register: async () => registration });
  const { extension, events } = setup({ navigator: { serviceWorker: container } });
  await extension.register({ script: "sw.js" });
  const worker = Object.assign(new EventTarget(), { state: "installing" });
  registration.installing = worker;
  registration.dispatchEvent(new Event("updatefound"));
  worker.state = "activated";
  worker.dispatchEvent(new Event("statechange"));
  worker.state = "redundant";
  worker.dispatchEvent(new Event("statechange"));
  assert.equal(events.some(event => event.name === "DemoPwaError"), false);
  const failed = Object.assign(new EventTarget(), { state: "installing" });
  registration.installing = failed;
  registration.dispatchEvent(new Event("updatefound"));
  failed.state = "redundant";
  failed.dispatchEvent(new Event("statechange"));
  assert.equal(events.filter(event => event.name === "DemoPwaError").length, 1);
  assert.equal(extension.status().serviceWorker, "error");
});

test("application events may reenter fallback or destroy registration without duplicate work or late listeners", async () => {
  let subscriptions = 0;
  const registration = new EventTarget();
  registration.addEventListener = () => { subscriptions++; };
  const container = Object.assign(new EventTarget(), { register: async () => registration });
  const { extension, root, events } = setup({ navigator: { serviceWorker: container } });
  const dispatch = root.AelluxJs.dispatchFrom;
  let nested, rendered = 0;
  root.AelluxJs.dispatchFrom = (...args) => {
    dispatch(...args);
    if (args[1] === "DemoPwaInstallRequested") nested = extension.install();
    if (args[1] === "DemoPwaWorkerRegistered") extension.destroy();
  };
  const task = extension.install({ fallback: () => { rendered++; } });
  assert.equal(nested, task);
  await task;
  assert.equal(rendered, 1);
  assert.equal(events.filter(event => event.name === "DemoPwaInstallRequested").length, 1);
  await extension.register({ script: "sw.js" });
  assert.equal(subscriptions, 0);
});

test("Full and Core source maps exclude page-side PWA and reusable worker implementations", async () => {
  for (const file of ["aellux", "aellux.esm", "aellux.orchestrator", "aellux.orchestrator.legacy", "aellux.full", "aellux.full.legacy"]) {
    for (const minified of ["", ".min"]) {
      const map = JSON.parse(await readFile(new URL(`../../dist/${file}${minified}.js.map`, import.meta.url), "utf8"));
      assert.equal(map.sources.some(path => /aellux\.(?:ext\.pwa|pwa\.sw)\.js$/.test(path)), false, file + minified);
    }
  }
  const extensionMap = JSON.parse(await readFile(new URL("../../dist/aellux.ext.pwa.js.map", import.meta.url), "utf8"));
  assert.equal(extensionMap.sources.some(path => /pwa\.sw/.test(path)), false);
  const manifest = JSON.parse(await readFile(new URL("../../dist/aellux.extensions.min.json", import.meta.url), "utf8"));
  assert.deepEqual(manifest.extensions.pwa.dependencies, []);
  assert.equal(manifest.extensions.pwa.style, undefined);
  assert.ok(manifest.extensions.pwa.builds.legacy.integrity.startsWith("sha384-"));
});
