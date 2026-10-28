import { expect, test } from "@playwright/test";

async function start(page, mode, forceLegacy) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ mode, forceLegacy }) => new Promise(resolve => {
    document.body.innerHTML = `<button id="control" data-ae-point="2" data-ae-trigger="toggle" data-ae-target="panel">
      <span id="child">Toggle</span></button>
      <section id="panel" data-ae-present="" data-ae-unpop-on-outside="false" hidden>
        <button id="dismiss" data-ae-point data-ae-dismiss>Dismiss</button>
      </section><button id="outside" data-ae-point>Outside</button>
      <button id="other" data-ae-point data-ae-trigger="toggle" data-ae-target="other-panel">Other</button>
      <section id="other-panel" data-ae-present="" data-ae-unpop-on-outside="false" hidden>Other panel</section>`;
    if (mode === "basic") {
      AelluxJs.ext("point");
      AelluxJs.ext("present", { loadStyle: true });
    }
    AelluxJs.on("Ready", resolve, { once: true });
    AelluxJs.init({ mode, forceLegacy });
  }), { mode, forceLegacy });
  await page.evaluate(() => {
    window.actions = [];
    window.tapCount = 0;
    for (const name of ["BeforePop", "BeforeUnpop"]) document.addEventListener(AelluxJs.eventName(name), event => {
      actions.push({ name, target: event.target.id });
    });
    document.addEventListener(AelluxJs.eventName("tap"), () => tapCount++);
    window.tapGesture = (id = "control", pointerId = 71, pointerType = "touch") => {
      const target = document.getElementById(id);
      const rect = target.getBoundingClientRect();
      const options = { bubbles: true, composed: true, pointerId, pointerType, isPrimary: true,
        clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, button: 0 };
      target.dispatchEvent(new PointerEvent("pointerdown", { ...options, buttons: 1 }));
      target.dispatchEvent(new PointerEvent("pointerup", { ...options, buttons: 0 }));
      if (pointerType === "mouse") target.dispatchEvent(new PointerEvent("pointerout", options));
    };
    window.clickGesture = (id = "child", pointerId = 71) => {
      const event = new PointerEvent("click", { bubbles: true, composed: true, cancelable: true,
        pointerId, pointerType: "touch", detail: 1 });
      document.getElementById(id).dispatchEvent(event);
      return event.defaultPrevented;
    };
  });
}

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test.describe(`Present tap (${mode}, ${forceLegacy ? "Legacy" : "Modern"})`, () => {
    test("tap alone opens, toggles, dismisses and closes from outside", async ({ page }) => {
      await start(page, mode, forceLegacy);
      await page.evaluate(() => tapGesture("child"));
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
      await page.evaluate(() => tapGesture());
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
      await page.evaluate(() => tapGesture());
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
      await page.evaluate(() => tapGesture("dismiss"));
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
      await page.evaluate(async () => {
        await $ae("panel").present.pop();
        document.getElementById("panel").removeAttribute("data-ae-unpop-on-outside");
        tapGesture("outside");
      });
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
      expect(await page.evaluate(() => ({ tapCount, actions: actions.length }))).toEqual({ tapCount: 5, actions: 6 });
    });

    test("click takes the action immediately and consumes the matching deferred tap", async ({ page }) => {
      await start(page, mode, forceLegacy);
      expect(await page.evaluate(() => {
        tapGesture();
        const beforeClick = actions.length;
        const prevented = clickGesture();
        return { beforeClick, afterClick: actions.length, prevented };
      })).toEqual({ beforeClick: 0, afterClick: 1, prevented: false });
      await page.waitForTimeout(64);
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
      expect(await page.evaluate(() => actions)).toEqual([{ name: "BeforePop", target: "panel" }]);
      // The next physical gesture is independent and closes the same control once.
      await page.evaluate(() => { tapGesture(); clickGesture(); });
      await page.waitForTimeout(64);
      expect(await page.evaluate(() => actions.map(action => action.name))).toEqual(["BeforePop", "BeforeUnpop"]);
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
    });

    test("real mouse activation and keyboard click retain one action each", async ({ page }) => {
      await start(page, mode, forceLegacy);
      await page.locator("#child").click();
      await page.waitForTimeout(64);
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
      expect(await page.evaluate(() => ({ tapCount, count: actions.length }))).toEqual({ tapCount: 1, count: 1 });
      await page.locator("#control").press("Enter");
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
      expect(await page.evaluate(() => ({ tapCount, count: actions.length }))).toEqual({ tapCount: 1, count: 2 });
    });

    test("a compatibility click in a later task still owns the activation", async ({ page }) => {
      await start(page, mode, forceLegacy);
      await page.evaluate(() => {
        tapGesture();
        setTimeout(() => clickGesture(), 0);
      });
      await page.waitForTimeout(64);
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
      expect(await page.evaluate(() => actions)).toEqual([{ name: "BeforePop", target: "panel" }]);
    });

    test("touch compatibility mouse click can use a different pointer ID", async ({ page }) => {
      await start(page, mode, forceLegacy);
      await page.evaluate(() => {
        tapGesture("control", 0);
        document.getElementById("child").dispatchEvent(new PointerEvent("click", {
          bubbles: true, composed: true, pointerType: "mouse", pointerId: 1, detail: 1
        }));
      });
      await page.waitForTimeout(64);
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
      expect(await page.evaluate(() => actions)).toEqual([{ name: "BeforePop", target: "panel" }]);
    });

    test("clicks on other controls or from another pointer do not cancel an unrelated tap", async ({ page }) => {
      await start(page, mode, forceLegacy);
      await page.evaluate(() => { tapGesture(); clickGesture("other", 72); });
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
      await expect(page.locator("#other-panel")).toHaveJSProperty("hidden", false);
      expect(await page.evaluate(() => actions.length)).toBe(2);
      await page.evaluate(() => { actions.length = 0; tapGesture(); clickGesture("child", 72); });
      await page.waitForTimeout(64);
      expect(await page.evaluate(() => actions.map(action => action.name))).toEqual(["BeforeUnpop", "BeforePop"]);
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
    });

    test("native touch tap and click toggle once per gesture", async ({ browser, browserName }) => {
      test.skip(browserName === "firefox", "Playwright Firefox does not support touch emulation.");
      const context = await browser.newContext({ hasTouch: true, baseURL: "http://127.0.0.1:4173" });
      try {
        const page = await context.newPage();
        await start(page, mode, forceLegacy);
        const rect = await page.locator("#control").boundingBox();
        for (let gesture = 1; gesture <= 6; gesture++) {
          await page.touchscreen.tap(rect.x + rect.width / 2, rect.y + rect.height / 2);
          await page.waitForTimeout(64);
          expect(await page.evaluate(() => ({ tapCount, count: actions.length })))
            .toEqual({ tapCount: gesture, count: gesture });
          await expect(page.locator("#panel")).toHaveJSProperty("hidden", gesture % 2 === 0);
        }
      } finally {
        await context.close();
      }
    });

    for (const [id, extension] of [["control", "present"], ["panel", "present"], ["control", "point"]]) {
      test(`unmount/remount ${id} in ${extension} cancels a queued tap`, async ({ page }) => {
        await start(page, mode, forceLegacy);
        await page.evaluate(async ({ id, extension }) => {
          tapGesture();
          await AelluxJs.unmount(id, extension);
          await AelluxJs.mount(id, extension);
        }, { id, extension });
        await page.waitForTimeout(64);
        expect(await page.evaluate(() => actions)).toEqual([]);
        await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
        await page.evaluate(() => tapGesture());
        await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
        expect(await page.evaluate(() => actions.length)).toBe(1);
      });
    }

    test("destroy cancels the fallback and removes its tap listener", async ({ page }) => {
      await start(page, mode, forceLegacy);
      await page.evaluate(async () => {
        tapGesture();
        await AelluxJs.destroyExtensions("present");
        tapGesture();
      });
      await page.waitForTimeout(64);
      expect(await page.evaluate(() => ({ tapCount, actions }))).toEqual({ tapCount: 2, actions: [] });
    });

    test("hover suppression also covers mouse tap fallback and keeps touch activation", async ({ page }) => {
      await start(page, mode, forceLegacy);
      await page.mouse.move(900, 600);
      await page.clock.install({ time: new Date("2026-10-23T12:00:00Z") });
      await page.clock.pauseAt(new Date("2026-10-23T12:00:01Z"));
      await page.evaluate(() => document.getElementById("control").setAttribute("data-ae-trigger-on", "hover"));
      await page.evaluate(() => document.getElementById("child").dispatchEvent(new PointerEvent("pointerover", {
        bubbles: true, pointerId: 81, pointerType: "mouse", isPrimary: true
      })));
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
      await page.evaluate(() => tapGesture("control", 81, "mouse"));
      await page.clock.runFor(32);
      expect(await page.evaluate(() => ({ tapCount, count: actions.length }))).toEqual({ tapCount: 1, count: 1 });
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
      await page.evaluate(() => tapGesture());
      await page.clock.runFor(400);
      await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
      expect(await page.evaluate(() => ({ tapCount, count: actions.length }))).toEqual({ tapCount: 2, count: 2 });
    });
  });
}
