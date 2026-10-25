import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLayoutScheduler } from "../../src/internal/build-layout-scheduler.js";

async function withClock(run) {
  const originals = {
    requestAnimationFrame: globalThis.requestAnimationFrame,
    cancelAnimationFrame: globalThis.cancelAnimationFrame,
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    performance: globalThis.performance,
    document: globalThis.document
  };
  let frameTime = 0;
  let wallTime = 0;
  let nextId = 1;
  const frames = new Map();
  const timers = new Map();
  const listeners = new Set();
  const documentAttributes = new Map();
  const document = {
    hidden: false,
    documentElement: {
      hasAttribute(name) { return documentAttributes.has(name); },
      getAttribute(name) { return documentAttributes.get(name) || null; },
      setAttribute(name, value) { documentAttributes.set(name, String(value)); },
      removeAttribute(name) { documentAttributes.delete(name); }
    },
    addEventListener(type, callback) {
      if (type === "visibilitychange") listeners.add(callback);
    },
    removeEventListener(type, callback) {
      if (type === "visibilitychange") listeners.delete(callback);
    }
  };
  globalThis.document = document;
  globalThis.performance = { now: () => wallTime };
  globalThis.requestAnimationFrame = callback => {
    const id = nextId++;
    frames.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = id => frames.delete(id);
  globalThis.setTimeout = (callback, delay = 0) => {
    const id = nextId++;
    timers.set(id, { callback, due: wallTime + delay });
    return id;
  };
  globalThis.clearTimeout = id => timers.delete(id);

  const clock = {
    document,
    get pendingFrames() { return frames.size; },
    get pendingTimers() { return timers.size; },
    busy(ms) { wallTime += ms; },
    show() {
      document.hidden = false;
      for (const callback of Array.from(listeners)) callback();
    },
    async step(ms = 1000 / 60) {
      frameTime += ms;
      wallTime += ms;
      for (const [id, timer] of Array.from(timers)) {
        if (timer.due <= wallTime) {
          timers.delete(id);
          timer.callback();
        }
      }
      const pending = Array.from(frames);
      frames.clear();
      for (const [, callback] of pending) callback(frameTime);
      for (let i = 0; i < 12; i++) await Promise.resolve();
    },
    async frames(count, ms = 1000 / 60) {
      for (let i = 0; i < count; i++) await this.step(ms);
    }
  };
  try {
    await run(clock);
  } finally {
    Object.assign(globalThis, originals);
  }
}

test("legacy calls preserve parameters, phase order, errors and clear", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    const order = [];
    const read = scheduler.read(value => {
      order.push("read");
      return value * 2;
    }, [3]);
    const update = scheduler.update(value => {
      order.push("update");
      return value + 1;
    }, [6]);
    await clock.step();
    assert.deepEqual(order, ["read", "update"]);
    assert.equal(await read, 6);
    assert.equal(await update, 7);
    const failed = scheduler.read(() => { throw new Error("failure"); });
    const next = scheduler.update(() => "still runs");
    await clock.step();
    await assert.rejects(failed, /failure/);
    assert.equal(await next, "still runs");
    const badThenable = scheduler.read(() => Object.defineProperty({}, "then", {
      get() { throw new Error("bad thenable"); }
    }));
    const afterThenable = scheduler.update(() => "still healthy");
    await clock.step();
    await assert.rejects(badThenable, /bad thenable/);
    assert.equal(await afterThenable, "still healthy");
    const pending = scheduler.read(() => { throw new Error("must not run"); });
    scheduler.clear();
    assert.equal(await pending, undefined);
    assert.equal(clock.pendingFrames, 0);
  });
});

test("numeric IDs join phases and replacement cancels the whole pending group", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    const calls = [];
    const joinedRead = scheduler.read(8, () => calls.push("joined read"));
    const joinedUpdate = scheduler.update(8, () => calls.push("joined update"));
    await clock.step();
    await Promise.all([joinedRead, joinedUpdate]);
    assert.deepEqual(calls, ["joined read", "joined update"]);
    calls.length = 0;
    const oldRead = scheduler.read(0, () => calls.push("old read"));
    const oldUpdate = scheduler.update(0, () => calls.push("old update"));
    const current = scheduler.read(0, () => calls.push("new read"));
    const independent = scheduler.update(1, () => calls.push("other ID"));
    assert.equal(await oldRead, undefined);
    assert.equal(await oldUpdate, undefined);
    await clock.step();
    await Promise.all([current, independent]);
    assert.deepEqual(calls, ["new read", "other ID"]);
    const oldWrite = scheduler.update(2, () => calls.push("old write"));
    const oldRead2 = scheduler.read(2, () => calls.push("old read 2"));
    const newWrite = scheduler.update(2, () => calls.push("new write"));
    assert.equal(await oldWrite, undefined);
    assert.equal(await oldRead2, undefined);
    await clock.step();
    await newWrite;
    assert.equal(calls.at(-1), "new write");
    const own = scheduler.read(5, () => calls.push("canceled"));
    assert.equal(scheduler.cancel(5), true);
    assert.equal(await own, undefined);
    assert.equal(scheduler.cancel(5), false);
    assert.equal(calls.includes("canceled"), false);
    assert.throws(() => scheduler.read(1.5, () => {}), TypeError);
    assert.throws(() => scheduler.sequence(NaN, { read() {} }), TypeError);
  });
});

test("sequences pass read results, keep stage order and finish finite repeats", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    const events = [];
    const result = scheduler.sequence(12,
      { read: () => { events.push("read1"); return 4; },
        update: value => events.push("update1:" + value) },
      { read: () => { events.push("read2"); return 7; },
        update: value => events.push("update2:" + value),
        repeat: { times: 2 } },
      { update: value => events.push("end:" + value) });
    await clock.frames(5);
    assert.deepEqual(await result, { id: 12, status: "completed" });
    assert.deepEqual(events, [
      "read1", "update1:4", "read2", "update2:7",
      "read2", "update2:7", "end:undefined"
    ]);
  });
});

test("repeats use completion time, accept seconds and do not overlap", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    const starts = [];
    const endings = [];
    let resolveUpdate;
    const result = scheduler.sequence(20, {
      read: () => { starts.push(globalThis.performance.now()); return starts.length; },
      update: () => new Promise(resolve => { resolveUpdate = resolve; }),
      repeat: { ms: 100, times: 2 }
    });
    await clock.step();
    assert.equal(starts.length, 1);
    await clock.frames(15);
    assert.equal(starts.length, 1);
    endings.push(globalThis.performance.now());
    resolveUpdate();
    await clock.step(10);
    await clock.step(80);
    assert.equal(starts.length, 1);
    await clock.step(30);
    assert.equal(starts.length, 2);
    resolveUpdate();
    await clock.step();
    assert.deepEqual(await result, { id: 20, status: "completed" });
    assert.ok(starts[1] - endings[0] >= 100);

    const seconds = scheduler.sequence(21, {
      update: () => endings.push(globalThis.performance.now()),
      repeat: { s: 1, times: 2 }
    });
    await clock.frames(2);
    const before = endings.length;
    await clock.step(900);
    assert.equal(endings.length, before);
    await clock.step(110);
    await clock.step();
    assert.equal(endings.length, before + 1);
    assert.equal((await seconds).status, "completed");
  });
});

test("replacement, abort and clear settle sequences and ignore stale async reads", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    let resolveRead;
    let staleUpdates = 0;
    const old = scheduler.sequence(31, {
      read: () => new Promise(resolve => { resolveRead = resolve; }),
      update: () => staleUpdates++,
      repeat: { ms: 20 }
    });
    await clock.step();
    const fresh = scheduler.sequence(31, { update: () => "new" });
    assert.deepEqual(await old, { id: 31, status: "superseded" });
    resolveRead("old");
    await clock.step();
    assert.equal(staleUpdates, 0);
    assert.equal((await fresh).status, "completed");

    const replacedByRead = scheduler.sequence(35, {
      read: () => 1,
      repeat: { ms: 100 }
    });
    const external = scheduler.read(35, () => 2);
    assert.deepEqual(await replacedByRead, { id: 35, status: "superseded" });
    await clock.step();
    assert.equal(await external, 2);

    let abort = false;
    let count = 0;
    const stopped = scheduler.sequence(32, {
      read: () => ++count,
      update: () => { abort = true; },
      repeat: { times: 4 },
      abort: () => abort
    });
    await clock.frames(3);
    assert.deepEqual(await stopped, { id: 32, status: "aborted" });
    assert.equal(count, 1);

    let finishRead;
    let shouldAbort = false;
    let laterUpdate = false;
    const interrupted = scheduler.sequence(34, {
      read: () => new Promise(resolve => { finishRead = resolve; }),
      update: () => { laterUpdate = true; },
      abort: () => shouldAbort
    });
    await clock.step();
    shouldAbort = true;
    finishRead(1);
    await clock.step();
    assert.deepEqual(await interrupted, { id: 34, status: "aborted" });
    assert.equal(laterUpdate, false);

    const infinite = scheduler.sequence(33, {
      update: () => ++count,
      repeat: { ms: 100 }
    });
    await clock.frames(2);
    assert.ok(clock.pendingTimers > 0);
    scheduler.clear();
    assert.deepEqual(await infinite, { id: 33, status: "cleared" });
    assert.equal(clock.pendingTimers, 0);
    assert.equal(clock.pendingFrames, 0);

    const canceledSequence = scheduler.sequence(36, {
      read: () => 3,
      repeat: { ms: 100 }
    });
    assert.equal(scheduler.cancel(36), true);
    assert.deepEqual(await canceledSequence, { id: 36, status: "aborted" });
  });
});

test("callback failures reject only their sequence", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    const failure = scheduler.sequence(40, {
      read: () => { throw new Error("bad read"); },
      update: () => { throw new Error("stale update"); }
    });
    const good = scheduler.sequence(41, { update: () => 1 });
    await clock.step();
    await assert.rejects(failure, /bad read/);
    assert.equal((await good).status, "completed");
    let rejected = false;
    const undefinedFailure = scheduler.sequence(42, {
      update: () => { throw undefined; }
    }).then(() => false, reason => {
      rejected = true;
      return reason;
    });
    await clock.frames(2);
    assert.equal(await undefinedFailure, undefined);
    assert.equal(rejected, true);
  });
});

test("AbortController and AbortSignal stop sequences immediately", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    const calls = [];

    const preAborted = new AbortController();
    preAborted.abort();
    const immediate = scheduler.sequence(80, {
      read: () => calls.push("pre-aborted"),
      abort: preAborted.signal
    });
    assert.deepEqual(await immediate, { id: 80, status: "aborted" });
    assert.equal(clock.pendingFrames, 0);

    const pendingController = new AbortController();
    const pending = scheduler.sequence(81, {
      read: () => calls.push("pending"),
      abort: pendingController
    });
    pendingController.abort();
    assert.deepEqual(await pending, { id: 81, status: "aborted" });
    assert.equal(clock.pendingFrames, 0);
    await clock.step();
    assert.deepEqual(calls, []);

    let resolveRead;
    const activeController = new AbortController();
    const active = scheduler.sequence(82, {
      read: () => new Promise(resolve => { resolveRead = resolve; }),
      update: () => calls.push("stale update"),
      abort: activeController.signal
    });
    await clock.step();
    activeController.abort();
    assert.deepEqual(await active, { id: 82, status: "aborted" });
    resolveRead(10);
    await clock.step();
    assert.deepEqual(calls, []);

    const timerController = new AbortController();
    const repeating = scheduler.sequence(83, {
      update: () => calls.push("tick"),
      repeat: { ms: 100 },
      abort: timerController.signal
    });
    await clock.frames(2);
    assert.equal(clock.pendingTimers, 1);
    timerController.abort();
    assert.deepEqual(await repeating, { id: 83, status: "aborted" });
    assert.equal(clock.pendingTimers, 0);
    await clock.step(500);
    assert.deepEqual(calls, ["tick"]);

    assert.throws(() => scheduler.sequence(84, {
      read() {},
      abort: {}
    }), TypeError);
  });
});

test("an AbortSignal on a later stage stops the entire sequence", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    const controller = new AbortController();
    const calls = [];
    const pending = scheduler.sequence(85,
      { read: () => calls.push("first"), repeat: { ms: 100 } },
      { update: () => calls.push("second"), abort: controller.signal });
    await clock.step();
    assert.equal(clock.pendingTimers, 1);
    controller.abort();
    assert.deepEqual(await pending, { id: 85, status: "aborted" });
    assert.equal(clock.pendingTimers, 0);
    await clock.step(500);
    assert.deepEqual(calls, ["first"]);
  });
});

test("global limiter runs at native cadence, adapts, recovers and handles hidden pages", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    let reads = 0;
    let costly = false;
    const ongoing = scheduler.sequence(50, {
      read: () => {
        reads++;
        if (costly) clock.busy(50);
      },
      repeat: { times: 1000 }
    });
    await clock.frames(30, 1000 / 120);
    assert.ok(reads >= 28, "120 Hz work should not be capped at 60");
    scheduler.clear();
    assert.equal((await ongoing).status, "cleared");

    reads = 0;
    const limited = scheduler.sequence(51, {
      read: () => {
        reads++;
        if (costly) clock.busy(50);
      },
      repeat: { times: 1000 }
    });
    await clock.frames(20);
    const before = reads;
    costly = true;
    await clock.frames(220);
    const slowRate = reads - before;
    assert.ok(slowRate < 170, "persistent callback cost should reduce work");
    costly = false;
    const beforeRecovery = reads;
    await clock.frames(120);
    const earlyRecovery = reads - beforeRecovery;
    await clock.frames(300);
    const beforeLate = reads;
    await clock.frames(120);
    const lateRecovery = reads - beforeLate;
    assert.ok(lateRecovery > earlyRecovery, "stable work should recover gradually");
    clock.document.hidden = true;
    await clock.step(1000);
    const hiddenCount = reads;
    await clock.frames(5, 1000);
    assert.equal(reads, hiddenCount);
    clock.show();
    await clock.step();
    assert.equal(reads, hiddenCount + 1);
    scheduler.clear();
    assert.equal((await limited).status, "cleared");
  });
});

test("per-stage maxFPS limits complete cycles without halving their rate", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    let cycles = 0;
    const result = scheduler.sequence(60, {
      read: () => cycles,
      update: () => { cycles++; },
      repeat: { times: 30 },
      maxFPS: 30
    });
    await clock.frames(62);
    assert.equal(cycles, 30);
    assert.equal((await result).status, "completed");
  });
});

test("without maxFPS, read/update and update-only cycles use every eligible frame", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    for (const browserFPS of [120, 60]) {
      let paired = 0;
      let updatesOnly = 0;
      const pair = scheduler.sequence(61, {
        read: () => paired,
        update: () => { paired++; },
        repeat: { times: 1000 }
      });
      const writes = scheduler.sequence(62, {
        update: () => { updatesOnly++; },
        repeat: { times: 1000 }
      });
      await Promise.resolve();
      await clock.frames(40, 1000 / browserFPS);
      assert.ok(paired >= 39, `paired cycles should follow ${browserFPS} Hz frames`);
      assert.ok(updatesOnly >= 39, `update-only cycles should follow ${browserFPS} Hz frames`);
      assert.equal(clock.pendingTimers, 0);
      scheduler.clear();
      assert.equal((await pair).status, "cleared");
      assert.equal((await writes).status, "cleared");
    }
  });
});

test("severe adaptive pressure drops directly to the matching FPS budget without catch-up frames", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    let calls = 0;
    const running = scheduler.sequence(70, {
      read: () => {
        calls++;
        clock.busy(100);
      },
      repeat: { ms: 0 }
    });
    await clock.frames(12);
    await clock.frames(60);
    assert.equal(clock.document.documentElement.getAttribute("data-ae-fps"), null,
      "less than two seconds of pressure must not lower the FPS budget");
    await clock.frames(84); // exceed the sustained-pressure observation window
    const beforeLowBudget = calls;
    await clock.frames(60);
    assert.ok(calls - beforeLowBudget >= 4 && calls - beforeLowBudget <= 6,
      "a 10 FPS workload should drop directly to the 5 FPS budget");
    const beforePause = calls;
    await clock.step(1000);
    assert.equal(calls, beforePause + 1);
    scheduler.clear();
    assert.equal((await running).status, "cleared");
  });
});

test("an idle gap preserves the adaptive FPS budget while allowing one recovery step", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    const pressured = scheduler.sequence(71, {
      read: () => clock.busy(100),
      repeat: { ms: 0 }
    });
    await clock.frames(144);
    assert.equal(scheduler.cancel(71), true);
    assert.equal((await pressured).status, "aborted");

    // This exceeds the scheduler's idle-measurement reset threshold.  The next
    // batch may recover one budget, but must not relearn the browser cadence
    // as its effective limit.
    await clock.step(1100);
    let calls = 0;
    const recovered = scheduler.sequence(72, {
      read: () => { calls++; },
      repeat: { ms: 0 }
    });
    assert.equal(clock.document.documentElement.getAttribute("data-ae-fps"), "15");
    await clock.frames(60);
    assert.ok(calls <= 17, `the recovered budget should remain below native FPS (got ${calls})`);
    scheduler.clear();
    assert.equal((await recovered).status, "cleared");
  });
});

test("timer-driven idle batches recover one FPS budget and publish it on html", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    const pressured = scheduler.sequence(73, {
      read: () => clock.busy(100), repeat: { ms: 0 }
    });
    await clock.frames(144);
    assert.equal(clock.document.documentElement.getAttribute("data-ae-fps"), "5");
    scheduler.cancel(73);
    await pressured;

    for (const expected of ["15", "30", "45", null]) {
      await clock.step(1100);
      const batch = scheduler.sequence(74, { read() {}, repeat: { ms: 0 } });
      await clock.step();
      assert.equal(clock.document.documentElement.getAttribute("data-ae-fps"), expected);
      scheduler.cancel(74);
      await batch;
    }
  });
});

test("visual FPS limits apply while native cadence is still being calibrated", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    scheduler.setVisualFPSLimit(901, 5);
    let calls = 0;
    const running = scheduler.sequence(902, { update() { calls++; }, repeat: { ms: 0 } });
    await Promise.resolve(); // queue the first update before advancing the clock
    await clock.frames(8);
    assert.equal(calls, 1, "calibration must not release eight unrestricted updates");
    await clock.frames(5);
    assert.equal(calls, 2);
    scheduler.clear();
    await running;
  });
});

test("a CSS Motion visual ceiling delays but preserves independent layout work", async () => {
  await withClock(async clock => {
    const scheduler = buildLayoutScheduler();
    const cadence = scheduler.sequence(75, { read() {}, repeat: { ms: 0 } });
    await clock.frames(10); // establish the native frame cadence
    scheduler.setVisualFPSLimit(900, 5);

    const calls = [];
    const work = [
      scheduler.read(() => { calls.push("anchor read"); return "anchor"; }),
      scheduler.read(() => { calls.push("scrollbox read"); return "scrollbox"; }),
      scheduler.update(() => { calls.push("anchor update"); return "anchor update"; }),
      scheduler.update(() => { calls.push("scrollbox update"); return "scrollbox update"; }),
      scheduler.read(76, () => { calls.push("id 76"); return 76; }),
      scheduler.read(77, () => { calls.push("id 77"); return 77; })
    ];
    await clock.frames(11);
    assert.deepEqual(calls, []);
    await clock.frames(1);
    assert.deepEqual(calls, ["anchor read", "scrollbox read", "id 76", "id 77",
      "anchor update", "scrollbox update"]);
    assert.deepEqual(await Promise.all(work),
      ["anchor", "scrollbox", "anchor update", "scrollbox update", 76, 77]);

    const old = scheduler.update(78, () => calls.push("superseded"));
    const replacement = scheduler.update(78, () => calls.push("replacement"));
    assert.equal(await old, undefined);
    const canceled = scheduler.read(79, () => calls.push("canceled"));
    assert.equal(scheduler.cancel(79), true);
    assert.equal(await canceled, undefined);
    await clock.frames(12);
    await replacement;
    assert.equal(calls.at(-1), "replacement");

    scheduler.setVisualFPSLimit(900, null);
    scheduler.clear();
    assert.equal((await cadence).status, "cleared");
  });
});
