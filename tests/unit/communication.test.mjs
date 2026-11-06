import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { createCommunication } from "../../src/internal/create-communication.js";
import { readFile, readdir } from "node:fs/promises";

test("communication works before DOM/runtime/polyfills and separates missing, empty and blocked results", () => {
  const comm = runInNewContext("(" + createCommunication.toString() + ")()", { Map: undefined, Set: undefined, Promise: undefined });
  assert.equal(comm.request("absent").handled, false);
  comm.handle("empty", () => null); comm.handle("blocked", () => false); comm.handle("void", () => {});
  assert.equal(comm.request("empty").handled, true); assert.equal(comm.request("empty").value, null);
  assert.equal(comm.request("blocked").value, false); assert.equal(comm.request("void").handled, true);
});

test("duplicate handlers diagnose without replacing the original provider", () => {
  const errors = [];
  const comm = createCommunication({ ERROR_COMM_DUPLICATE: 1130,
    error(code, context) { errors.push({ code, context }); return new Error("duplicate"); } });
  comm.handle("selection", () => 1, { owner: "first" });
  assert.throws(() => comm.handle("selection", () => 2, { owner: "second" }), /duplicate/);
  assert.equal(comm.request("selection").value, 1);
  assert.equal(errors[0].context.registeredOwner, "first");
});

test("request keeps synchronous returns/errors and explicit asynchronous completion", async () => {
  const comm = createCommunication(), error = new Error("preparation failed");
  comm.handle("sync", value => value + 1);
  comm.handle("throw", () => { throw error; });
  comm.handle("async", async () => { throw error; });
  assert.equal(comm.request("sync", 4).value, 5);
  assert.throws(() => comm.request("throw"), cause => cause === error);
  await assert.rejects(comm.request("async").value, cause => cause === error);
});

test("notifications have explicit order, removal during emit and isolated failures", async () => {
  const calls = [], errors = [];
  const comm = createCommunication({ error: (_, context) => errors.push(context.cause) });
  let remove;
  comm.on("changed", () => { calls.push("first"); remove(); comm.on("changed", () => calls.push("late")); }, { priority: 2 });
  remove = comm.on("changed", () => calls.push("removed"));
  comm.on("changed", () => { throw new Error("sync"); }, { priority: 1 });
  comm.on("changed", async () => { throw new Error("async"); });
  comm.on("changed", () => calls.push("last"));
  assert.equal(comm.emit("changed", {}), 4);
  await Promise.resolve();
  assert.deepEqual(calls, ["first", "last"]);
  assert.deepEqual(errors.map(error => error.message), ["sync", "async"]);
});

test("owners, abort and clear release providers and notifications without affecting other owners", () => {
  const comm = createCommunication(), abort = new AbortController(); let called = 0;
  comm.handle("owned", () => 1, { owner: "ext" });
  comm.on("changed", () => called++, { owner: "ext" });
  comm.handle("other", () => 2, { owner: "other", signal: abort.signal });
  comm.removeOwner("ext"); comm.emit("changed");
  assert.equal(called, 0); assert.equal(comm.has("owned"), false); assert.equal(comm.has("other"), true);
  abort.abort(); assert.equal(comm.has("other"), false);
  comm.handle("aborted", () => 3, { signal: abort.signal }); assert.equal(comm.has("aborted"), false);
  comm.handle("last", () => 4); comm.clear(); assert.equal(comm.has("last"), false);
  assert.throws(() => comm.handle("invalid", () => 5, { signal: {} }), TypeError);
  assert.equal(comm.has("invalid"), false);
});

test("runtime Extensions do not consume another Extension's API or import its implementation", async () => {
  const directory = new URL("../../src/", import.meta.url);
  for (const file of (await readdir(directory)).filter(file => /^aellux\.ext\..+\.js$/.test(file) && !file.endsWith(".css.js"))) {
    const source = await readFile(new URL(file, directory), "utf8");
    assert.doesNotMatch(source, /\b(?:AelluxJs|api)\.ext\.[a-zA-Z]/, file);
    assert.doesNotMatch(source, /import\s.*["']\.\/aellux\.ext\./, file);
    assert.doesNotMatch(source, /mountManager\.controller\([^)]*\)\?*\.(?:present|input|anchor|focus|scrollbox)/, file);
  }
});
