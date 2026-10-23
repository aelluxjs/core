import { expect, test } from "@playwright/test";

async function openTap(page, forceLegacy, markup = '<button id="control" data-ae-point>Tap</button>', extensions = []) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ forceLegacy, markup, extensions }) => new Promise(resolve => {
    document.body.innerHTML = markup;
    AelluxJs.ext("point");
    for (const extension of extensions) AelluxJs.ext(extension, { loadStyle: true });
    AelluxJs.on("Ready", resolve, { once: true });
    AelluxJs.init({ mode: "basic", forceLegacy, skipGlobalMount: true });
  }), { forceLegacy, markup, extensions });
  await page.evaluate(async () => {
    await AelluxJs.mount(document);
    window.taps = [];
    document.addEventListener(AelluxJs.eventName("tap"), event => taps.push({
      target: event.target.id, type: event.type,
      custom: event instanceof CustomEvent, bubbles: event.bubbles, composed: event.composed,
      pointerType: event.detail.pointerType, pointerId: event.detail.pointerId,
      duration: event.detail.duration, distance: event.detail.distance,
      originalType: event.detail.originalEvent.type
    }));
    window.emitPointPointer = (target, type, options = {}) => {
      const element = typeof target === "string" ? document.getElementById(target) : target;
      const event = new PointerEvent(type, {
        bubbles: true, composed: true, cancelable: true,
        pointerId: 71, pointerType: "touch", isPrimary: true,
        button: 0, buttons: type === "pointerup" || type === "pointercancel" ? 0 : 1,
        clientX: 20, clientY: 20, ...options
      });
      element.dispatchEvent(event);
      return event.defaultPrevented;
    };
    window.shortPress = (target, options = {}) => {
      emitPointPointer(target, "pointerdown", options);
      emitPointPointer(target, "pointerup", options);
    };
  });
}

for (const forceLegacy of [false, true]) {
  test.describe(`Point tap (${forceLegacy ? "Legacy" : "Modern"})`, () => {
    test("mounted buttons, links and role buttons emit one bubbling CustomEvent", async ({ page }) => {
      await openTap(page, forceLegacy, `<button id="button" data-ae-point><span id="child">Tap</span></button>
        <a id="link" data-ae-point href="#destination">Link</a>
        <div id="role" role="button" tabindex="0" data-ae-point>Role</div>`);
      const result = await page.evaluate(() => {
        shortPress("child");
        shortPress("link");
        shortPress("role");
        return taps;
      });
      expect(result.map(tap => tap.target)).toEqual(["button", "link", "role"]);
      for (const tap of result) {
        expect(tap).toMatchObject({ type: "AelluxJsTap", custom: true, bubbles: true,
          composed: true, pointerType: "touch", pointerId: 71, distance: 0, originalType: "pointerup" });
        expect(tap.duration).toBeGreaterThanOrEqual(0);
        expect(tap.duration).toBeLessThanOrEqual(300);
      }
    });

    test("attributes alone do not enable unmounted or ineligible elements", async ({ page }) => {
      await openTap(page, forceLegacy, `<button id="plain">Plain</button>
        <div id="div" data-ae-point>Div</div><input id="input" data-ae-point>
        <button id="zero" data-ae-point="0">Zero</button>
        <button id="control" data-ae-point>Unmounted</button>`);
      const result = await page.evaluate(async () => {
        await AelluxJs.unmount("control", "point");
        for (const id of ["plain", "div", "input", "zero", "control"]) shortPress(id);
        const before = taps.slice();
        await AelluxJs.mount("control", "point");
        shortPress("control");
        return { before, targets: taps.map(tap => tap.target) };
      });
      expect(result).toEqual({ before: [], targets: ["control"] });
    });

    test("duration accepts 300 ms and rejects longer presses", async ({ page }) => {
      await openTap(page, forceLegacy);
      await page.clock.install({ time: new Date("2026-10-23T12:00:00Z") });
      await page.clock.pauseAt(new Date("2026-10-23T12:00:01Z"));
      await page.evaluate(() => emitPointPointer("control", "pointerdown"));
      await page.clock.runFor(300);
      await page.evaluate(() => {
        emitPointPointer("control", "pointerup");
        emitPointPointer("control", "pointerdown");
      });
      await page.clock.runFor(301);
      await page.evaluate(() => emitPointPointer("control", "pointerup"));
      expect(await page.evaluate(() => taps.map(tap => tap.duration))).toEqual([300]);
    });

    test("maximum radial movement includes excursions that return to the start", async ({ page }) => {
      await openTap(page, forceLegacy);
      const result = await page.evaluate(() => {
        for (const [pointerType, limit] of [["touch", 10], ["mouse", 4], ["pen", 10]]) {
          emitPointPointer("control", "pointerdown", { pointerType });
          emitPointPointer("control", "pointermove", { pointerType, clientX: 20 + limit });
          emitPointPointer("control", "pointerup", { pointerType });
          for (const [dx, dy] of [[limit + 1, 0], [limit, limit]]) {
            emitPointPointer("control", "pointerdown", { pointerType });
            emitPointPointer("control", "pointermove", { pointerType, clientX: 20 + dx, clientY: 20 + dy });
            emitPointPointer("control", "pointermove", { pointerType });
            emitPointPointer("control", "pointerup", { pointerType });
          }
          // Displacement on release counts even without a preceding pointermove.
          emitPointPointer("control", "pointerdown", { pointerType });
          emitPointPointer("control", "pointerup", { pointerType, clientY: 21 + limit });
        }
        return taps.map(({ pointerType, distance }) => ({ pointerType, distance }));
      });
      expect(result).toEqual([
        { pointerType: "touch", distance: 10 }, { pointerType: "mouse", distance: 4 },
        { pointerType: "pen", distance: 10 }
      ]);
    });

    test("cancel, release outside, and unrelated pointer IDs do not complete a tap", async ({ page }) => {
      await openTap(page, forceLegacy, '<button id="control" data-ae-point>Tap</button><div id="outside">Outside</div>');
      expect(await page.evaluate(() => {
        emitPointPointer("control", "pointerdown");
        emitPointPointer("control", "pointercancel");
        emitPointPointer("control", "pointerup");
        emitPointPointer("control", "pointerdown");
        emitPointPointer("outside", "pointerup");
        emitPointPointer("control", "pointerdown");
        emitPointPointer("control", "pointerup", { pointerId: 72 });
        const before = taps.length;
        emitPointPointer("control", "pointerup");
        return { before, after: taps.length };
      })).toEqual({ before: 0, after: 1 });
    });

    test("coalesced samples contribute to maximum movement and cancellation", async ({ page }) => {
      await openTap(page, forceLegacy);
      expect(await page.evaluate(() => {
        for (const distance of [5, 11]) {
          emitPointPointer("control", "pointerdown");
          const move = new PointerEvent("pointermove", { bubbles: true, pointerId: 71,
            pointerType: "touch", isPrimary: true, clientX: 20, clientY: 20 });
          Object.defineProperty(move, "getCoalescedEvents", {
            value: () => [{ clientX: 20 + distance, clientY: 20 }]
          });
          document.getElementById("control").dispatchEvent(move);
          emitPointPointer("control", "pointerup");
        }
        return taps.map(tap => tap.distance);
      })).toEqual([5]);
    });

    test("duplicate and reentrant releases consume a candidate once", async ({ page }) => {
      await openTap(page, forceLegacy);
      expect(await page.evaluate(() => {
        document.getElementById("control").addEventListener(AelluxJs.eventName("PointerUp"), () => {
          emitPointPointer("control", "pointerup");
        }, { once: true });
        shortPress("control");
        emitPointPointer("control", "pointerup");
        return taps.length;
      })).toBe(1);
    });

    test("secondary pointers, mouse buttons and multitouch never activate controls", async ({ page }) => {
      await openTap(page, forceLegacy, '<button id="control" data-ae-point="2">Tap</button>');
      expect(await page.evaluate(() => {
        shortPress("control", { isPrimary: false });
        shortPress("control", { pointerType: "mouse", button: 2, buttons: 2 });
        emitPointPointer("control", "pointerdown");
        emitPointPointer(document.body, "pointerdown", { pointerId: 72, isPrimary: false });
        emitPointPointer("control", "pointerup");
        emitPointPointer(document.body, "pointerup", { pointerId: 72, isPrimary: false });
        const before = taps.length;
        shortPress("control");
        return { before, after: taps.length };
      })).toEqual({ before: 0, after: 1 });
    });

    test("disabled controls and controls disabled during a press cannot tap", async ({ page }) => {
      await openTap(page, forceLegacy, `<button id="disabled" data-ae-point disabled>Disabled</button>
        <fieldset disabled><button id="fieldset" data-ae-point>Fieldset</button></fieldset>
        <a id="aria" data-ae-point aria-disabled="true">Disabled link</a>
        <div role="button" id="role" data-ae-point aria-disabled="true">Disabled role</div>
        <button id="control" data-ae-point>Tap</button>`);
      expect(await page.evaluate(() => {
        for (const id of ["disabled", "fieldset", "aria", "role"]) shortPress(id);
        emitPointPointer("control", "pointerdown");
        document.getElementById("control").disabled = true;
        emitPointPointer("control", "pointerup");
        return taps;
      })).toEqual([]);
    });

    test("native click keeps its trusted event, default activation and keyboard path", async ({ page }) => {
      await openTap(page, forceLegacy, '<a id="control" data-ae-point href="#destination">Link</a>');
      await page.evaluate(() => {
        window.activations = [];
        const control = document.getElementById("control");
        control.addEventListener(AelluxJs.eventName("tap"), () => activations.push("tap"));
        control.addEventListener("click", event => activations.push({
          type: "click", trusted: event.isTrusted, prevented: event.defaultPrevented
        }));
      });
      await page.locator("#control").click();
      await expect(page).toHaveURL(/#destination$/);
      await page.locator("#control").press("Enter");
      expect(await page.evaluate(() => activations)).toEqual([
        "tap", { type: "click", trusted: true, prevented: false },
        { type: "click", trusted: true, prevented: false }
      ]);
    });

    test("pointerup emits tap immediately without needing click or preventing native events", async ({ page }) => {
      await openTap(page, forceLegacy);
      expect(await page.evaluate(() => {
        let clicks = 0;
        document.getElementById("control").addEventListener("click", () => clicks++);
        const downPrevented = emitPointPointer("control", "pointerdown");
        const upPrevented = emitPointPointer("control", "pointerup");
        return { taps: taps.length, clicks, downPrevented, upPrevented };
      })).toEqual({ taps: 1, clicks: 0, downPrevented: false, upPrevented: false });
    });

    test("native touch emits tap and keeps a trusted click", async ({ browser, browserName }) => {
      test.skip(browserName === "firefox", "Playwright Firefox does not support touch emulation.");
      const context = await browser.newContext({ hasTouch: true, baseURL: "http://127.0.0.1:4173" });
      try {
        const page = await context.newPage();
        await openTap(page, forceLegacy);
        await page.evaluate(() => {
          window.touchClicks = [];
          document.getElementById("control").addEventListener("click", event => touchClicks.push({
            trusted: event.isTrusted, prevented: event.defaultPrevented
          }));
        });
        const rect = await page.locator("#control").boundingBox();
        await page.touchscreen.tap(rect.x + rect.width / 2, rect.y + rect.height / 2);
        expect(await page.evaluate(() => ({ types: taps.map(tap => tap.pointerType), touchClicks })))
          .toEqual({ types: ["touch"], touchClicks: [{ trusted: true, prevented: false }] });
      } finally {
        await context.close();
      }
    });

    for (const mode of ["native", "pointer"]) {
      test(`scroll and activation inside a ${mode} Scrollbox preserve taps and clicks`, async ({ page }) => {
        await openTap(page, forceLegacy, `<div id="box" data-ae-scrollbox="${mode}" style="width:300px;height:150px;overflow:auto;scroll-behavior:auto">
          <div style="height:1000px"><button id="control" data-ae-point>Tap</button></div>
          </div>`, ["scrollbox"]);
        expect(await page.evaluate(() => {
          const box = document.getElementById("box");
          const control = document.getElementById("control");
          control.addEventListener(AelluxJs.eventName("PointerUp"), () => { box.scrollTop += 20; });
          control.addEventListener(AelluxJs.eventName("tap"), () => { box.scrollTop += 20; });
          emitPointPointer("control", "pointerdown");
          box.scrollTop = 20;
          box.dispatchEvent(new Event("scroll"));
          window.dispatchEvent(new Event("scroll"));
          emitPointPointer("control", "pointerup");
          return { count: taps.length, scrollTop: box.scrollTop };
        })).toEqual({ count: 1, scrollTop: 60 });
        await page.evaluate(() => {
          document.getElementById("box").scrollTop = 0;
          window.clicks = 0;
          document.getElementById("control").addEventListener("click", () => clicks++);
        });
        await page.locator("#control").click();
        expect(await page.evaluate(() => ({ count: taps.length, clicks }))).toEqual({ count: 2, clicks: 1 });
      });
    }

    test("unmount, dynamic mount, remount and destroy release pending interactions", async ({ page }) => {
      await openTap(page, forceLegacy);
      const result = await page.evaluate(async () => {
        emitPointPointer("control", "pointerdown");
        await AelluxJs.unmount("control", "point");
        await AelluxJs.mount("control", "point");
        emitPointPointer("control", "pointerup");
        const afterPending = taps.length;
        for (let index = 0; index < 3; index++) {
          await AelluxJs.unmount("control", "point");
          shortPress("control");
          await AelluxJs.mount("control", "point");
          await AelluxJs.mount("control", "point");
          shortPress("control");
        }
        const dynamic = document.createElement("button");
        dynamic.id = "dynamic";
        dynamic.setAttribute(AelluxJs.attr("point"), "");
        document.body.append(dynamic);
        shortPress(dynamic);
        await AelluxJs.mount(dynamic, "point");
        shortPress(dynamic);
        emitPointPointer(dynamic, "pointerdown");
        const point = AelluxJs.ext.point;
        const record = point.pointers(dynamic)[0];
        await AelluxJs.destroyExtensions("point");
        emitPointPointer(dynamic, "pointerup");
        shortPress("control");
        return { afterPending, targets: taps.map(tap => tap.target),
          remaining: point.pointers(dynamic).length, cleared: record.tap === null };
      });
      expect(result).toEqual({ afterPending: 0, targets: ["control", "control", "control", "dynamic"],
        remaining: 0, cleared: true });
    });

    test("tap emission consults eventName and crosses an open shadow boundary", async ({ page }) => {
      await openTap(page, forceLegacy);
      expect(await page.evaluate(async () => {
        const host = document.createElement("div");
        document.body.append(host);
        const shadow = host.attachShadow({ mode: "open" });
        shadow.innerHTML = '<button data-ae-point>Shadow</button>';
        const control = shadow.querySelector("button");
        await AelluxJs.mount(control, "point");
        const eventName = AelluxJs.eventName;
        const names = [];
        AelluxJs.eventName = function (name) {
          names.push(name);
          return name === "tap" ? "point-test-tap" : eventName.call(this, name);
        };
        const received = [];
        document.addEventListener("point-test-tap", event => received.push({
          custom: event instanceof CustomEvent, composed: event.composed,
          origin: event.composedPath()[0] === control
        }));
        shortPress(control);
        return { consulted: names.includes("tap"), received };
      })).toEqual({ consulted: true, received: [{ custom: true, composed: true, origin: true }] });
    });

    test("pointer capture rejects release outside the control within movement tolerance", async ({ page }) => {
      await openTap(page, forceLegacy);
      await page.evaluate(() => {
        const control = document.getElementById("control");
        control.addEventListener("pointerdown", event => control.setPointerCapture(event.pointerId));
      });
      const rect = await page.locator("#control").boundingBox();
      await page.mouse.move(rect.x + rect.width - 1, rect.y + rect.height / 2);
      await page.mouse.down();
      await page.mouse.move(rect.x + rect.width + 2, rect.y + rect.height / 2);
      await page.mouse.up();
      expect(await page.evaluate(() => taps)).toEqual([]);
    });

    test("scrolling a captured control during its press does not invalidate a stationary tap", async ({ page }) => {
      await openTap(page, forceLegacy, `<div id="box" style="width:300px;height:150px;overflow:auto;scroll-behavior:auto">
        <div style="height:1000px"><button id="control" data-ae-point>Tap</button></div></div>`);
      await page.evaluate(() => {
        const control = document.getElementById("control");
        control.addEventListener("pointerdown", event => {
          control.setPointerCapture(event.pointerId);
          document.getElementById("box").scrollTop = 100;
        });
      });
      const rect = await page.locator("#control").boundingBox();
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.down();
      await page.mouse.up();
      expect(await page.evaluate(() => ({ count: taps.length, scrollTop: document.getElementById("box").scrollTop })))
        .toEqual({ count: 1, scrollTop: 100 });
    });

    test("scroll can retarget an uncaptured release without canceling a stationary tap", async ({ page }) => {
      await openTap(page, forceLegacy, `<div id="box" style="width:300px;height:150px;overflow:auto;scroll-behavior:auto">
        <div style="height:1000px"><button id="control" data-ae-point>Tap</button></div></div>`);
      await page.evaluate(() => {
        document.getElementById("control").addEventListener("pointerdown", () => {
          document.getElementById("box").scrollTop = 100;
        });
      });
      const rect = await page.locator("#control").boundingBox();
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.down();
      await page.mouse.up();
      expect(await page.evaluate(() => ({ count: taps.length, scrollTop: document.getElementById("box").scrollTop })))
        .toEqual({ count: 1, scrollTop: 100 });
    });
  });
}
