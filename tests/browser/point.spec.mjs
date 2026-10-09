import { expect, test } from "@playwright/test";

async function openPoint(page) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.setAttribute(AelluxJs.attr("point"), "2");
    AelluxJs.ext("point");
    return AelluxJs.init({ mode: "basic" });
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.point?.initialized)).toBe(true);
  await expect.poll(() => page.evaluate(() => !!AelluxJs.mountManager.controller(document.body)?.point)).toBe(true);
}

test("pointer tracks independent presses, cumulative deltas, and release", async ({ page }) => {
  await openPoint(page);

  const result = await page.evaluate(() => {
    const target = document.body;
    const emit = (type, pointerId, x, y) => target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, pointerId, pointerType: "touch", clientX: x, clientY: y,
      buttons: type === "pointerup" ? 0 : 1
    }));
    emit("pointerdown", 11, 10, 20);
    emit("pointerdown", 12, 100, 200);
    emit("pointermove", 11, 18, 16);
    const pointers = () => AelluxJs.mountManager.controller(target).point.pointers();
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

test("release reaches press origin and resets it on the next press", async ({ page }) => {
  await openPoint(page);

  const result = await page.evaluate(async () => {
    const outer = document.body;
    outer.id = "outer";
    const first = document.createElement("div");
    const second = document.createElement("div");
    first.id = "first";
    second.id = "second";
    first.setAttribute(AelluxJs.attr("point"), "");
    second.setAttribute(AelluxJs.attr("point"), "");
    outer.append(first, second);
    await AelluxJs.mount(outer, "point");

    const events = [];
    for (const element of [first, second, outer]) {
      for (const name of ["PointerDown", "PointerMove", "PointerUp", "PointerCancel"]) {
        element.addEventListener(`AelluxJs${name}`, event => events.push({
          name,
          receiver: element.id,
          pointables: event.detail.pointables.map(pointable => pointable.id),
          pressStart: event.detail.pressStart?.map(pointable => pointable.id) ?? null
        }));
      }
    }
    const emit = (target, type) => target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, pointerId: 40, pointerType: "mouse"
    }));
    emit(first, "pointerdown");
    emit(second, "pointermove");
    emit(second, "pointerup");
    emit(second, "pointerdown");
    emit(first, "pointercancel");
    return events;
  });

  expect(result.filter(event => event.name === "PointerUp")).toEqual([
    { name: "PointerUp", receiver: "second", pointables: ["second", "outer"], pressStart: ["first", "outer"] },
    { name: "PointerUp", receiver: "outer", pointables: ["second", "outer"], pressStart: ["first", "outer"] },
    { name: "PointerUp", receiver: "first", pointables: ["second", "outer"], pressStart: ["first", "outer"] }
  ]);
  expect(result.filter(event => event.name === "PointerCancel")).toEqual([
    { name: "PointerCancel", receiver: "first", pointables: ["first", "outer"], pressStart: ["second", "outer"] },
    { name: "PointerCancel", receiver: "outer", pointables: ["first", "outer"], pressStart: ["second", "outer"] },
    { name: "PointerCancel", receiver: "second", pointables: ["first", "outer"], pressStart: ["second", "outer"] }
  ]);
  expect(result.filter(event => event.name === "PointerDown" && event.receiver === "second")[0]).toMatchObject({
    pressStart: ["second", "outer"]
  });
  expect(result.filter(event => event.name === "PointerMove" && event.receiver === "second")[0]).toMatchObject({
    pressStart: ["first", "outer"]
  });
});

test("pointerup outside pointables reaches pressStart with an empty current chain", async ({ page }) => {
  await openPoint(page);

  const result = await page.evaluate(async () => {
    await AelluxJs.unmount(document.body, "point");
    document.body.removeAttribute(AelluxJs.attr("point"));
    document.body.innerHTML = '<div id="origin" data-ae-point></div><div id="outside"></div>';
    await AelluxJs.mount(document, "point");

    const origin = document.getElementById("origin");
    const outside = document.getElementById("outside");
    const received = [];
    origin.addEventListener("AelluxJsPointerUp", event => received.push({
      pointables: event.detail.pointables.map(element => element.id),
      pressStart: event.detail.pressStart.map(element => element.id),
      pressed: event.detail.pointer.pressed
    }));

    origin.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerId: 42, pointerType: "touch"
    }));
    outside.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, pointerId: 42, pointerType: "touch"
    }));
    return { received, remaining: AelluxJs.ext.point.pointers(origin).length };
  });

  expect(result).toEqual({
    received: [{ pointables: [], pressStart: ["origin"], pressed: false }],
    remaining: 0
  });
});

test("unmounted press origin does not receive release", async ({ page }) => {
  await openPoint(page);

  const result = await page.evaluate(async () => {
    const first = document.createElement("div");
    const second = document.createElement("div");
    first.id = "first";
    second.id = "second";
    first.setAttribute(AelluxJs.attr("point"), "");
    second.setAttribute(AelluxJs.attr("point"), "");
    document.body.append(first, second);
    await AelluxJs.mount(document.body, "point");
    const received = [];
    first.addEventListener("AelluxJsPointerUp", () => received.push("first"));
    second.addEventListener("AelluxJsPointerUp", event => received.push({
      receiver: "second",
      pressStart: event.detail.pressStart.map(element => element.id)
    }));
    first.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerId: 41, pointerType: "touch"
    }));
    await AelluxJs.unmount(first, "point");
    second.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true, pointerId: 41, pointerType: "touch"
    }));
    return received;
  });

  expect(result).toEqual([{ receiver: "second", pressStart: [""] }]);
});

test("pointer retains hover across child elements and clears it on document exit", async ({ page }) => {
  await openPoint(page);

  const result = await page.evaluate(() => {
    const first = document.createElement("div");
    const second = document.createElement("div");
    document.body.append(first, second);
    const pointers = () => AelluxJs.mountManager.controller(document.body).point.pointers();
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
  await openPoint(page);

  const result = await page.evaluate(async () => {
    const outer = document.body;
    outer.id = "outer";
    const inner = document.createElement("div");
    inner.id = "inner";
    inner.setAttribute(AelluxJs.attr("point"), "");
    outer.append(inner);
    await AelluxJs.mount(inner, "point");

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
    const innerPointers = AelluxJs.mountManager.controller(inner).point.pointers()
      .map(pointer => pointer.pointerId);
    const outerPointers = AelluxJs.mountManager.controller(outer).point.pointers()
      .map(pointer => pointer.pointerId);
    emit(outer, "pointermove", 21, 5);
    const movedChain = AelluxJs.ext.point.pointers(outer)
      .find(pointer => pointer.pointerId === 21).pointables.map(element => element.id);
    const firstEventChainAfterMove = firstPointables.map(element => element.id);
    inner.setAttribute(AelluxJs.attr("point"), "0");
    emit(inner, "pointerup", 22, 2);
    emit(inner, "pointerdown", 23, 3);
    const afterZeroLimit = {
      inner: AelluxJs.ext.point.pointers(inner).map(pointer => pointer.pointerId),
      outer: AelluxJs.ext.point.pointers(outer).map(pointer => pointer.pointerId)
    };
    await AelluxJs.unmount(inner, "point");
    return {
      events, innerPointers, outerPointers, movedChain, firstEventChainAfterMove, afterZeroLimit,
      afterUnmount: AelluxJs.ext.point.pointers(inner).length
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
  await openPoint(page);

  const result = await page.evaluate(async () => {
    const outer = document.body;
    outer.setAttribute(AelluxJs.attr("point"), "0");
    const inner = document.createElement("div");
    inner.setAttribute(AelluxJs.attr("point"), "");
    outer.append(inner);
    await AelluxJs.mount(inner, "point");
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
      outerPointers: AelluxJs.mountManager.controller(outer).point.pointers().length,
      innerPointers: AelluxJs.mountManager.controller(inner).point.pointers().length
    };
  });

  expect(result).toEqual({
    received: [{ receiver: "inner", chain: [true], bubbles: false }],
    outerPointers: 0, innerPointers: 1
  });
});

test("hover enters and leaves each affected pointable once", async ({ page }) => {
  await openPoint(page);

  const result = await page.evaluate(async () => {
    const outer = document.body;
    outer.id = "outer";
    const first = document.createElement("div");
    first.id = "first";
    first.setAttribute(AelluxJs.attr("point"), "");
    const second = document.createElement("div");
    second.id = "second";
    second.setAttribute(AelluxJs.attr("point"), "");
    outer.append(first, second);
    await AelluxJs.mount(outer, "point");
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
  await openPoint(page);

  const result = await page.evaluate(async () => {
    const pointer = AelluxJs.ext.point;
    document.body.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerId: 7, pointerType: "touch", clientX: 1, clientY: 2
    }));
    const beforeDestroy = pointer.pointers(document.body).length;
    await AelluxJs.destroyExtensions("point");
    document.body.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true, pointerId: 8, pointerType: "touch", clientX: 3, clientY: 4
    }));
    return { beforeDestroy, afterDestroy: pointer.pointers(document.body).length };
  });
  expect(result).toEqual({ beforeDestroy: 1, afterDestroy: 0 });
});
