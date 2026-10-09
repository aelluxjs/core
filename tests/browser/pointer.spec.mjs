import { expect, test } from "@playwright/test";

async function openPointer(page) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.setAttribute(AelluxJs.attr("pointable"), "2");
    AelluxJs.ext("pointer");
    return AelluxJs.init({ mode: "basic" });
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.pointer?.initialized)).toBe(true);
  await expect.poll(() => page.evaluate(() => !!AelluxJs.mountManager.controller(document.body)?.pointer)).toBe(true);
}

test("pointer tracks independent presses, cumulative deltas, and release", async ({ page }) => {
  await openPointer(page);

  const result = await page.evaluate(() => {
    const target = document.body;
    const emit = (type, pointerId, x, y) => target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, pointerId, pointerType: "touch", clientX: x, clientY: y,
      buttons: type === "pointerup" ? 0 : 1
    }));
    emit("pointerdown", 11, 10, 20);
    emit("pointerdown", 12, 100, 200);
    emit("pointermove", 11, 18, 16);
    const pointers = () => AelluxJs.mountManager.controller(target).pointer.pointers();
    const first = pointers().find(pointer => pointer.pointerId === 11);
    const beforeRelease = {
      ids: pointers().map(pointer => pointer.pointerId),
      first: {
        initial: { ...first.initial }, current: { ...first.current },
        delta: { ...first.delta }, pressed: first.pressed, hover: first.hover
      }
    };
    emit("pointerup", 11, 20, 15);
    const afterRelease = {
      ids: pointers().map(pointer => pointer.pointerId),
      removed: pointers().find(pointer => pointer.pointerId === 11) || null
    };
    emit("pointercancel", 12, 100, 200);
    return { beforeRelease, afterRelease, remaining: pointers().length };
  });

  expect(result).toEqual({
    beforeRelease: {
      ids: [11, 12],
      first: {
        initial: { x: 10, y: 20 }, current: { x: 18, y: 16 },
        delta: { x: 8, y: -4 }, pressed: true, hover: false
      }
    },
    afterRelease: { ids: [12], removed: null }, remaining: 0
  });
});

test("pointer retains hover across child elements and clears it on document exit", async ({ page }) => {
  await openPointer(page);

  const result = await page.evaluate(() => {
    const first = document.createElement("div");
    const second = document.createElement("div");
    document.body.append(first, second);
    const pointers = () => AelluxJs.mountManager.controller(document.body).pointer.pointers();
    const hoverEvents = [];
    document.body.addEventListener("AelluxJsPointerHover", event => {
      hoverEvents.push({
        hover: event.detail.hover,
        pointables: event.detail.pointables.map(element => element === document.body)
      });
    });
    const emit = (target, type, x, y, relatedTarget = null) =>
      target.dispatchEvent(new PointerEvent(type, {
        bubbles: true, pointerId: 1, pointerType: "mouse", clientX: x, clientY: y,
        relatedTarget
      }));
    emit(first, "pointerover", 5, 10);
    emit(first, "pointermove", 12, 14);
    emit(first, "pointerout", 12, 14, second);
    const afterChildExit = pointers()[0];
    const hover = {
      count: pointers().length,
      initial: { ...afterChildExit.initial }, current: { ...afterChildExit.current },
      delta: { ...afterChildExit.delta }, hover: afterChildExit.hover
    };
    emit(second, "pointerdown", 20, 30);
    emit(second, "pointermove", 22, 35);
    emit(second, "pointerup", 22, 35);
    const afterRelease = pointers()[0];
    const released = {
      initial: { ...afterRelease.initial }, delta: { ...afterRelease.delta },
      pressed: afterRelease.pressed, hover: afterRelease.hover
    };
    emit(second, "pointerout", 22, 35);
    return { hover, released, hoverEvents, remaining: pointers().length };
  });

  expect(result).toEqual({
    hover: {
      count: 1, initial: { x: 5, y: 10 }, current: { x: 12, y: 14 },
      delta: { x: 7, y: 4 }, hover: true
    },
    released: {
      initial: { x: 20, y: 30 }, delta: { x: 2, y: 5 },
      pressed: false, hover: true
    },
    hoverEvents: [
      { hover: true, pointables: [true] },
      { hover: false, pointables: [true] }
    ],
    remaining: 0
  });
});

test("pointable limits route events and expose the nearest-to-outermost chain", async ({ page }) => {
  await openPointer(page);

  const result = await page.evaluate(async () => {
    const outer = document.body;
    outer.id = "outer";
    const inner = document.createElement("div");
    inner.id = "inner";
    inner.setAttribute(AelluxJs.attr("pointable"), "");
    outer.append(inner);
    await AelluxJs.mount(inner, "pointer");

    const events = [];
    let firstPointables;
    const onDown = event => {
      if (!firstPointables) firstPointables = event.detail.pointables;
      events.push({
        receiver: event.currentTarget.id,
        target: event.target.id,
        bubbles: event.bubbles,
        chain: event.detail.pointables.map(element => element.id),
        pointerChain: event.detail.pointer.pointables.map(element => element.id),
        originalType: event.detail.originalEvent.type
      });
    };
    inner.addEventListener("AelluxJsPointerDown", onDown);
    outer.addEventListener("AelluxJsPointerDown", onDown);
    const emit = (target, type, pointerId, x) =>
      target.dispatchEvent(new PointerEvent(type, {
        bubbles: true, pointerId, pointerType: "touch", clientX: x, clientY: 10
      }));
    emit(inner, "pointerdown", 21, 1);
    emit(inner, "pointerdown", 22, 2);
    const innerPointers = AelluxJs.mountManager.controller(inner).pointer.pointers()
      .map(pointer => pointer.pointerId);
    const outerPointers = AelluxJs.mountManager.controller(outer).pointer.pointers()
      .map(pointer => pointer.pointerId);
    emit(outer, "pointermove", 21, 5);
    const movedChain = AelluxJs.ext.pointer.pointers(outer)
      .find(pointer => pointer.pointerId === 21).pointables.map(element => element.id);
    const firstEventChainAfterMove = firstPointables.map(element => element.id);
    inner.setAttribute(AelluxJs.attr("pointable"), "0");
    emit(inner, "pointerup", 22, 2);
    emit(inner, "pointerdown", 23, 3);
    const afterZeroLimit = {
      inner: AelluxJs.ext.pointer.pointers(inner).map(pointer => pointer.pointerId),
      outer: AelluxJs.ext.pointer.pointers(outer).map(pointer => pointer.pointerId)
    };
    await AelluxJs.unmount(inner, "pointer");
    return {
      events, innerPointers, outerPointers, movedChain, firstEventChainAfterMove, afterZeroLimit,
      afterUnmount: AelluxJs.ext.pointer.pointers(inner).length
    };
  });

  expect(result).toEqual({
    events: [
      { receiver: "inner", target: "inner", bubbles: false, chain: ["inner", "outer"], pointerChain: ["inner", "outer"], originalType: "pointerdown" },
      { receiver: "outer", target: "outer", bubbles: false, chain: ["inner", "outer"], pointerChain: ["inner", "outer"], originalType: "pointerdown" },
      { receiver: "outer", target: "outer", bubbles: false, chain: ["outer"], pointerChain: ["outer"], originalType: "pointerdown" },
      { receiver: "outer", target: "outer", bubbles: false, chain: ["outer"], pointerChain: ["outer"], originalType: "pointerdown" }
    ],
    innerPointers: [21], outerPointers: [21, 22], movedChain: ["outer"],
    firstEventChainAfterMove: ["inner", "outer"],
    afterZeroLimit: { inner: [], outer: [21, 23] }, afterUnmount: 0
  });
});

test("an excluded ancestor does not receive a pointable event", async ({ page }) => {
  await openPointer(page);

  const result = await page.evaluate(async () => {
    const outer = document.body;
    outer.setAttribute(AelluxJs.attr("pointable"), "0");
    const inner = document.createElement("div");
    inner.setAttribute(AelluxJs.attr("pointable"), "");
    outer.append(inner);
    await AelluxJs.mount(inner, "pointer");
    const received = [];
    inner.addEventListener("AelluxJsPointerDown", event => received.push({
      receiver: "inner", chain: event.detail.pointables.map(element => element === inner),
      bubbles: event.bubbles
    }));
    outer.addEventListener("AelluxJsPointerDown", () => received.push({ receiver: "outer" }));
    inner.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerId: 31, pointerType: "touch"
    }));
    return {
      received,
      outerPointers: AelluxJs.mountManager.controller(outer).pointer.pointers().length,
      innerPointers: AelluxJs.mountManager.controller(inner).pointer.pointers().length
    };
  });

  expect(result).toEqual({
    received: [{ receiver: "inner", chain: [true], bubbles: false }],
    outerPointers: 0, innerPointers: 1
  });
});

test("hover enters and leaves each affected pointable once", async ({ page }) => {
  await openPointer(page);

  const result = await page.evaluate(async () => {
    const outer = document.body;
    outer.id = "outer";
    const first = document.createElement("div");
    first.id = "first";
    first.setAttribute(AelluxJs.attr("pointable"), "");
    const second = document.createElement("div");
    second.id = "second";
    second.setAttribute(AelluxJs.attr("pointable"), "");
    outer.append(first, second);
    await AelluxJs.mount(outer, "pointer");
    const events = [];
    for (const element of [outer, first, second]) {
      element.addEventListener("AelluxJsPointerHover", event => {
        events.push({
          receiver: event.currentTarget.id,
          hover: event.detail.hover,
          bubbles: event.bubbles,
          chain: event.detail.pointables.map(pointable => pointable.id)
        });
      });
    }
    const emit = (target, type, relatedTarget = null) =>
      target.dispatchEvent(new PointerEvent(type, {
        bubbles: true, pointerId: 1, pointerType: "mouse", relatedTarget
      }));
    emit(first, "pointerover");
    emit(first, "pointerout", second);
    emit(second, "pointerover", first);
    emit(second, "pointerout");
    return events;
  });

  expect(result).toEqual([
    { receiver: "first", hover: true, bubbles: false, chain: ["first", "outer"] },
    { receiver: "outer", hover: true, bubbles: false, chain: ["first", "outer"] },
    { receiver: "first", hover: false, bubbles: false, chain: ["first", "outer"] },
    { receiver: "second", hover: true, bubbles: false, chain: ["second", "outer"] },
    { receiver: "second", hover: false, bubbles: false, chain: ["second", "outer"] },
    { receiver: "outer", hover: false, bubbles: false, chain: ["second", "outer"] }
  ]);
});

test("pointer destroy clears records and detaches listeners", async ({ page }) => {
  await openPointer(page);

  const result = await page.evaluate(async () => {
    const pointer = AelluxJs.ext.pointer;
    document.body.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerId: 7, pointerType: "touch", clientX: 1, clientY: 2
    }));
    const beforeDestroy = pointer.pointers(document.body).length;
    await AelluxJs.destroyExtensions("pointer");
    document.body.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerId: 8, pointerType: "touch", clientX: 3, clientY: 4
    }));
    return { beforeDestroy, afterDestroy: pointer.pointers(document.body).length };
  });
  expect(result).toEqual({ beforeDestroy: 1, afterDestroy: 0 });
});
