import { expect, test } from "@playwright/test";

for (const axis of ["x", "y"]) {
  for (const oversized of [false, true]) {
    test(`PDS ${axis} nearest release respects ${oversized ? "oversized free scrolling" : "clamped edge snap points"}`,
      async ({ page }) => {
        const viewport = oversized ? 100 : 500;
        const sizes = oversized ? [100, 1000, 100] : [200, 200, 300];
        await page.goto("/tests/index.htm");
        await page.addScriptTag({ url: "/dist/aellux.js" });
        await page.evaluate(({ axis, viewport, sizes }) => {
          document.body.innerHTML = `<div id="gallery" data-ae-scrollbox="pointer"
            data-ae-scrollbox-snap="${axis === "y" ? "vertical" : "horizontal"}"
            style="width:${axis === "x" ? viewport : 100}px;height:${axis === "y" ? viewport : 100}px;overflow:auto;user-select:none">
            <div style="display:flex;flex-direction:${axis === "x" ? "row" : "column"};width:${axis === "x" ? sizes.reduce((a, b) => a + b) : 100}px">
              ${sizes.map(size => `<div data-ae-snap-item style="flex:none;width:${axis === "x" ? size : 100}px;height:${axis === "y" ? size : 100}px"></div>`).join("")}
            </div></div>`;
          AelluxJs.ext("scrollbox", { loadStyle: true });
          AelluxJs.ext("scrollbox-snap");
        }, { axis, viewport, sizes });
        await page.addScriptTag({ url: "/dist/aellux.ext.scrollbox.js" });
        await page.addScriptTag({ url: "/src/aellux.ext.scrollbox-snap.js" });
        await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
        await expect(page.locator("#gallery")).toHaveClass(/ae--snap-ready/);
        const held = await page.evaluate(async ({ axis, oversized }) => {
          const element = document.getElementById("gallery");
          const rect = element.getBoundingClientRect();
          const distance = oversized ? 150 : 20;
          const options = { bubbles: true, cancelable: true, isPrimary: true,
            pointerId: 720, pointerType: "mouse", button: 0, buttons: 1,
            clientX: rect.left + 80, clientY: rect.top + 80 };
          element.dispatchEvent(new PointerEvent("pointerdown", options));
          options[axis === "x" ? "clientX" : "clientY"] -= distance;
          window.dispatchEvent(new PointerEvent("pointermove", options));
          const held = element[axis === "x" ? "scrollLeft" : "scrollTop"];
          await new Promise(resolve => setTimeout(resolve, 150));
          window.dispatchEvent(new PointerEvent("pointerup", { ...options, buttons: 0 }));
          return held;
        }, { axis, oversized });
        expect(held).toBe(oversized ? 150 : 20);
        await expect.poll(() => page.locator("#gallery").evaluate(element => getComputedStyle(element).scrollSnapType))
          .toBe(`${axis} mandatory`);
        await page.waitForTimeout(350);
        expect(await page.locator("#gallery").evaluate((element, axis) => element[axis === "x" ? "scrollLeft" : "scrollTop"], axis))
          .toBe(oversized ? 150 : 0);
      });
  }
}

for (const axis of ["x", "y"]) {
  for (const elastic of [false, true]) {
    for (const flick of [false, true]) {
      test(`PDS ${axis} ${flick ? "flick" : "nearest"} release stays smooth and interruptible${elastic ? " with elastic" : ""}`,
        async ({ page }) => {
          await page.goto("/tests/index.htm");
          await page.addScriptTag({ url: "/dist/aellux.js" });
          await page.evaluate(({ axis, elastic }) => {
            document.body.innerHTML = `<div id="gallery" data-ae-scrollbox="pointer"
              data-ae-scrollbox-snap="${axis === "y" ? "vertical" : "horizontal"}"
              style="width:300px;height:300px;overflow:auto;user-select:none">
              <div ${elastic ? "data-ae-scrollbox-elastic" : ""}
                style="display:flex;flex-direction:${axis === "y" ? "column" : "row"};width:${axis === "y" ? 300 : 900}px;height:${axis === "y" ? 900 : 300}px">
                ${'<div data-ae-snap-item style="flex:none;width:300px;height:300px"></div>'.repeat(3)}
              </div></div>`;
            AelluxJs.ext("scrollbox", { loadStyle: true });
            AelluxJs.ext("scrollbox-snap");
          }, { axis, elastic });
          await page.addScriptTag({ url: "/dist/aellux.ext.scrollbox.js" });
          await page.addScriptTag({ url: "/src/aellux.ext.scrollbox-snap.js" });
          await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
          await expect(page.locator("#gallery")).toHaveClass(/ae--snap-ready/);

          const result = await page.evaluate(async ({ axis, flick }) => {
            const element = document.getElementById("gallery");
            const property = axis === "x" ? "scrollLeft" : "scrollTop";
            const rect = element.getBoundingClientRect();
            const distance = flick ? 60 : 180;
            const samples = [];
            let pointerId = 700;
            const dispatch = (type, distance = 0) => {
              const options = { bubbles: true, cancelable: true, isPrimary: true,
                pointerId, pointerType: "mouse", button: 0,
                buttons: type === "pointerup" ? 0 : 1,
                clientX: rect.left + 270 - (pointerId - 700) * 30 - (axis === "x" ? distance : 0),
                clientY: rect.top + 270 - (pointerId - 700) * 30 - (axis === "y" ? distance : 0) };
              (type === "pointerdown" ? element : window).dispatchEvent(new PointerEvent(type, options));
            };
            const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
            const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
            dispatch("pointerdown");
            dispatch("pointermove", distance);
            const held = element[property];
            dispatch("pointerup", distance);
            await Promise.resolve();
            const released = element[property];
            const deadline = performance.now() + 3000;
            while (element.classList.contains("ae--snap-suspended") && performance.now() < deadline) {
              samples.push(element[property]);
              await frame();
            }
            const settled = element[property];

            AelluxJs.ext.scrollboxSnap.goto(element, 0, "instant");
            while (element[property] > 1 && performance.now() < deadline + 3000) await frame();
            pointerId++;
            dispatch("pointerdown");
            dispatch("pointermove", distance);
            dispatch("pointerup", distance);
            let interrupted = null;
            const interruptDeadline = performance.now() + 3000;
            while (performance.now() < interruptDeadline) {
              await frame();
              if (element[property] > distance + 5 && element[property] < 295) {
                pointerId++;
                dispatch("pointerdown");
                interrupted = element[property];
                break;
              }
            }
            await wait(150);
            const still = element[property];
            dispatch("pointermove", 2);
            const moved = element[property];
            await wait(150);
            dispatch("pointerup", 2);
            return { held, released, settled, samples, interrupted, still, moved };
          }, { axis, flick });
          expect(result.held).toBe(flick ? 60 : 180);
          expect(result.released).toBe(result.held);
          expect(result.samples.some(value => value > result.held + 1 && value < 299)).toBe(true);
          expect(result.samples.every((value, index, samples) => value >= result.held &&
            value <= 300 && (!index || value >= samples[index - 1]))).toBe(true);
          expect(result.settled).toBe(300);
          expect(result.interrupted).not.toBeNull();
          expect(result.still).toBe(result.interrupted);
          expect(Math.abs(result.moved - result.still - 2)).toBeLessThanOrEqual(1);
          await expect.poll(() => page.locator("#gallery").evaluate(element => getComputedStyle(element).scrollSnapType))
            .toBe(`${axis} mandatory`);
          if (!elastic && !flick) {
            const lifecycle = await page.evaluate(async axis => {
              const element = document.getElementById("gallery");
              const property = axis === "x" ? "scrollLeft" : "scrollTop";
              const rect = element.getBoundingClientRect();
              const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
              const gesture = pointerId => {
                const origin = pointerId === 710 ? 250 : 220;
                const event = (type, distance) => new PointerEvent(type, {
                  bubbles: true, cancelable: true, isPrimary: true, pointerType: "mouse",
                  pointerId, button: 0, buttons: type === "pointerup" ? 0 : 1,
                  clientX: rect.left + origin - (axis === "x" ? distance : 0),
                  clientY: rect.top + origin - (axis === "y" ? distance : 0)
                });
                element.dispatchEvent(event("pointerdown", 0));
                window.dispatchEvent(event("pointermove", 180));
                window.dispatchEvent(event("pointerup", 180));
              };
              AelluxJs.updatePreferenceAttributesHTML({ reducedMotion: "reduced" });
              AelluxJs.ext.scrollboxSnap.goto(element, 0, "instant");
              gesture(710);
              await Promise.resolve();
              const reduced = element[property];
              const reducedSuspended = element.classList.contains("ae--snap-suspended");
              AelluxJs.updatePreferenceAttributesHTML({ reducedMotion: "no-preference" });
              AelluxJs.ext.scrollboxSnap.goto(element, 0, "instant");
              gesture(711);
              await wait(50);
              AelluxJs.mountManager.unmount("gallery", "scrollbox-snap");
              const unmounted = element[property];
              await wait(350);
              return { reduced, reducedSuspended, unmounted, after: element[property],
                ready: element.classList.contains("ae--snap-ready") };
            }, axis);
            expect(lifecycle.reduced).toBe(300);
            expect(lifecycle.reducedSuspended).toBe(false);
            expect(lifecycle.ready).toBe(false);
            expect(lifecycle.after).toBe(lifecycle.unmounted);
          }
        });
    }
  }
}
