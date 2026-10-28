import { expect, test } from "@playwright/test";

async function start(page, markup, options = {}) {
  await page.goto("/tests/index.htm");
  await page.mouse.move(-100, -100);
  await page.evaluate(markup => { document.body.innerHTML = markup; }, markup);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(options => {
    if (options.mode === "basic") AelluxJs.ext("present", { loadStyle: true });
    AelluxJs.init({ mode: "full", ...options });
  }, options);
  await expect.poll(() => page.evaluate(() => !!AelluxJs.ext.present?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.mount(document, "present"));
  await expect(page.locator('link[data-ae-ext-style="present"],link[data-ae-full-style]')).toHaveCount(1);
  await page.evaluate(async () => {
    const link = document.querySelector('link[data-ae-ext-style="present"],link[data-ae-full-style]');
    if (!link.sheet) await new Promise(resolve => link.addEventListener("load", resolve, { once: true }));
  });
}

async function trackGroupWarnings(page) {
  await page.evaluate(() => {
    window.groupWarnings = 0;
    const warn = AelluxJs.diagnostics.warn;
    AelluxJs.diagnostics.warn = function (definition, context) {
      if (definition.code === 2021) window.groupWarnings++;
      return warn.call(this, definition, context);
    };
  });
}

const panels = `<div id="group" data-ae-present-group data-ae-present-active="a" class="view-a">
  <section id="a" data-ae-present="opacity" data-ae-present-when="view-a">A</section>
  <section id="b" data-ae-present="opacity" data-ae-present-when="view-b" hidden><button id="inside">B</button></section>
  <section id="c" data-ae-present="opacity" hidden>C</section>
</div>`;

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`group IDs reject targets outside mounted membership (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `<div id="group" data-ae-present-group data-ae-present-active="a">
      <div id="a" data-ae-present>A</div>
      <div><div id="wrapped" data-ae-present hidden>Wrapped descendant</div></div>
      <div id="plain-child" hidden>Not Present</div>
      <div id="unmounted" data-ae-present hidden>Unmounted</div>
      <div data-ae-present-group><div id="nested-member" data-ae-present hidden>Nested</div></div>
    </div>
    <div id="outside" data-ae-present hidden>Outside</div>
    <div data-ae-present-group><div id="other-member" data-ae-present hidden>Other group</div></div>`, { mode, forceLegacy });
    await trackGroupWarnings(page);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("unmounted"), "present"));
    for (const id of ["outside", "other-member", "nested-member", "plain-child", "unmounted", "group", "missing"]) {
      const result = await page.evaluate(async id => {
        const controller = $ae("group").present;
        const before = window.groupWarnings;
        const accepted = await controller.show(id);
        return { accepted, warned: window.groupWarnings > before, selected: controller.selected()?.id,
          active: document.getElementById("group").getAttribute("data-ae-present-active") };
      }, id);
      expect(result, id).toEqual({ accepted: false, warned: true, selected: "a", active: "a" });
      const warningsBefore = await page.evaluate(id => {
        const count = window.groupWarnings;
        document.getElementById("group").setAttribute("data-ae-present-active", id);
        return count;
      }, id);
      await expect.poll(() => page.evaluate(() => window.groupWarnings))
        .toBeGreaterThan(warningsBefore);
      expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("a");
      await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
      for (const target of ["outside", "other-member", "nested-member", "wrapped", "unmounted"]) {
        await expect(page.locator(`#${target}`)).toHaveJSProperty("hidden", true);
      }
      await page.evaluate(() => $ae("group").present.show("a"));
    }
    const result = await page.evaluate(async () => {
      let key;
      document.getElementById("group").addEventListener("AelluxJsPresentGroupChange", event => {
        key = event.detail.key;
      }, { once: true });
      return { accepted: await $ae("group").present.show("wrapped"), key };
    });
    expect(result).toEqual({ accepted: true, key: "wrapped" });
    await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
  });
}

test("group observes member ID changes and rejects duplicate IDs without changing selection", async ({ page }) => {
  await start(page, `<div id="group" data-ae-present-group data-ae-present-active="renamed">
    <div id="a" data-ae-present>A</div><div id="b" data-ae-present hidden>B</div></div>`);
  await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(e => e.code === 2021))).toBe(true);
  await page.locator("#b").evaluate(element => { element.id = "renamed"; });
  await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
  await expect(page.locator("#renamed")).toHaveJSProperty("hidden", false);
  expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("renamed");
  await trackGroupWarnings(page);
  await page.evaluate(async () => {
    const group = document.getElementById("group");
    group.insertAdjacentHTML("beforeend", '<div id="duplicate" data-ae-present hidden>1</div><div id="duplicate" data-ae-present hidden>2</div>');
    await AelluxJs.mount(group, "present");
  });
  const duplicate = await page.evaluate(async () => {
    const warnings = window.groupWarnings;
    return { accepted: await $ae("group").present.show("duplicate"),
      warned: window.groupWarnings > warnings };
  });
  expect(duplicate).toEqual({ accepted: false, warned: true });
  expect(await page.evaluate(() => $ae("group").present.selected()?.id)).toBe("renamed");
  await expect(page.locator('[id="duplicate"]:visible')).toHaveCount(0);
  await page.locator("#renamed").evaluate(element => element.removeAttribute("id"));
  await expect.poll(() => page.evaluate(() => $ae("group").present.selected())).toBe(null);
});

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`group attribute, classes, API, veto and rapid replacement (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, panels, { mode, forceLegacy });
    await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
    expect(await page.evaluate(() => $ae("group").present.show("a"))).toBe(true);
    await page.evaluate(() => $ae("group").present.show("b"));
    await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
    await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
    await expect(page.locator("#group")).toHaveAttribute("data-ae-present-active", "b");
    await page.evaluate(() => {
      document.getElementById("group").className = "view-a";
    });
    await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
    await page.evaluate(() => document.getElementById("group").removeAttribute("data-ae-present-active"));
    await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
    await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
    await page.evaluate(() => {
      document.getElementById("group").className = "view-b";
    });
    await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
    await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
    await page.locator("#inside").focus();
    expect(await page.evaluate(async () => {
      document.getElementById("b").addEventListener("AelluxJsBeforeUnpop", event => event.preventDefault(), { once: true });
      return $ae("group").present.show("c");
    })).toBe(false);
    await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
    await expect(page.locator("#c")).toHaveJSProperty("hidden", true);
    await expect(page.locator("#group")).toHaveAttribute("data-ae-present-active", "b");
    const results = await page.evaluate(async () => {
      const controller = $ae("group").present;
      return Promise.all([controller.show("a"), controller.show("c"), controller.show("b")]);
    });
    expect(results.at(-1)).toBe(true);
    for (const id of ["a", "c"]) await expect(page.locator(`#${id}`)).toHaveJSProperty("hidden", true);
    await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
    expect(await page.evaluate(() => $ae.ext.present.show(document.getElementById("group"), "missing"))).toBe(false);
    await expect(page.locator("#group")).toHaveAttribute("data-ae-present-active", "b");
  });
}

for (const cssMotionController of [true, false]) {
  test(`progress endpoints, easing, reversal and restoration (controller=${cssMotionController})`, async ({ page }) => {
    await start(page, `<div id="panel" data-ae-present="opacity" hidden data-ae-maxfps="20"
      style="--ae-pop-duration:600ms;--ae-unpop-duration:300ms;--ae-pop-ease:ease-in;--ae-pop-progress:0.7">
      <span id="child" style="opacity:var(--ae-pop-progress)">Content</span></div>
      <div id="visible" data-ae-present="opacity">Visible</div>`, { cssMotionController });
    const progress = () => page.locator("#panel").evaluate(element => {
      const style = getComputedStyle(element);
      return [Number(style.getPropertyValue("--ae-pop-progress")), Number(style.getPropertyValue("--ae-unpop-progress"))];
    });
    expect(await progress()).toEqual([0, 1]);
    expect(await page.locator("#visible").evaluate(element => [
      getComputedStyle(element).getPropertyValue("--ae-pop-progress").trim(),
      getComputedStyle(element).getPropertyValue("--ae-unpop-progress").trim()
    ])).toEqual(["1", "0"]);
    await page.evaluate(() => { window.opening = $ae("panel").present.pop(); });
    await expect.poll(async () => (await progress())[0]).toBeGreaterThan(0);
    const sample = await page.locator("#panel").evaluate(element => {
      const animation = element.getAnimations().find(a => a.transitionProperty === "--ae-present-pop-phase");
      return { value: Number(getComputedStyle(element).getPropertyValue("--ae-pop-progress")),
        time: Number(animation?.currentTime), duration: animation?.effect.getTiming().duration,
        child: Number(getComputedStyle(document.getElementById("child")).opacity) };
    });
    expect(sample.value).toBeGreaterThan(0);
    expect(sample.value).toBeLessThan(1);
    expect(sample.child).toBeCloseTo(sample.value, 2);
    expect(sample.value).toBeLessThan(sample.time / sample.duration + 0.06);
    await page.evaluate(() => $ae("panel").present.unpop());
    expect(await progress()).toEqual([0, 1]);
    await page.evaluate(async () => {
      await Promise.all([$ae("panel").present.pop(), $ae("panel").present.pop()]);
    });
    expect(await progress()).toEqual([1, 0]);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("panel"), "present"));
    expect(await page.locator("#panel").evaluate(element => [
      element.style.getPropertyValue("--ae-pop-progress"), element.style.getPropertyValue("--ae-unpop-progress")
    ])).toEqual(["0.7", ""]);
  });
}

test("groups diagnose ambiguity, isolate nested members, mount dynamically and restore on unmount", async ({ page }) => {
  await start(page, panels);
  await page.evaluate(() => {
    const group = document.getElementById("group");
    group.removeAttribute("data-ae-present-active");
    group.className = "view-a view-b";
  });
  await expect.poll(() => page.evaluate(() => AelluxJs.diagnostics.showHistory().some(entry => entry.code === 2021))).toBe(true);
  await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await page.evaluate(async () => {
    const group = document.getElementById("group");
    group.insertAdjacentHTML("beforeend", `<div id="nested" data-ae-present-group data-ae-present-active="nested-a">
      <div id="nested-a" data-ae-present hidden>Nested</div></div>
      <div id="dynamic" data-ae-present hidden>Dynamic</div>`);
    await AelluxJs.mount(group, "present");
    await $ae("group").present.show("dynamic");
  });
  await expect(page.locator("#nested-a")).toHaveJSProperty("hidden", false);
  await expect(page.locator("#dynamic")).toHaveJSProperty("hidden", false);
  await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
  await page.evaluate(async () => {
    document.getElementById("dynamic").remove();
    await $ae("group").present.show("b");
    await AelluxJs.unmount(document.getElementById("group"), "present");
  });
  await expect(page.locator("#group")).toHaveAttribute("data-ae-present-active", "a");
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await page.evaluate(() => AelluxJs.mount(document.getElementById("group"), "present"));
  await page.evaluate(() => $ae("group").present.show("b"));
  await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
});

test("hover shares trigger/panel region, tolerates gaps, preserves keyboard and outside clicks", async ({ page }) => {
  await start(page, `<button id="trigger" data-ae-trigger="pop" data-ae-trigger-on="hover" data-ae-target="b"><span>Open</span></button>
    <button id="other" data-ae-trigger="pop" data-ae-trigger-on="hover" data-ae-target="b">Other</button>${panels}`);
  await page.locator("#trigger span").hover();
  await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
  await page.locator("#b").hover();
  await page.waitForTimeout(180);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
  await page.mouse.move(900, 600);
  await page.waitForTimeout(40);
  await page.locator("#other").hover();
  await page.waitForTimeout(180);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
  await page.mouse.move(900, 600);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await page.locator("#trigger").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
  await page.locator("#trigger").evaluate(element => element.blur());
  await page.mouse.click(900, 600);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
});

test("touch hover is ignored, click toggles once, descendants and remount do not duplicate pop", async ({ page }) => {
  await start(page, `<button id="trigger" data-ae-trigger="toggle" data-ae-trigger-on="hover" data-ae-target="panel"><span>Open</span></button>
    <div id="panel" data-ae-present="opacity" hidden>Panel</div>`);
  await page.evaluate(() => {
    window.pops = 0;
    document.getElementById("panel").addEventListener("AelluxJsBeforePop", () => window.pops++);
    document.getElementById("trigger").dispatchEvent(new PointerEvent("pointerover", { bubbles: true, pointerType: "touch" }));
    document.getElementById("trigger").click();
  });
  await expect(page.locator("#panel")).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => window.pops)).toBe(1);
  await page.evaluate(async () => {
    await $ae("panel").present.unpop();
    await AelluxJs.unmount(document.getElementById("trigger"), "present");
    await AelluxJs.mount(document.getElementById("trigger"), "present");
  });
  await page.locator("#trigger").hover();
  await page.locator("#trigger span").hover();
  await expect(page.locator("#panel")).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => window.pops)).toBe(2);
  await page.locator("#trigger").click();
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
  await page.mouse.move(900, 600);
  await page.evaluate(() => AelluxJs.unmount(document.getElementById("panel"), "present"));
  await page.waitForTimeout(200);
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
});

for (const fallback of ["unregistered", "no-waapi", "reduced"]) {
  test(`progress preserves visual completion with ${fallback}`, async ({ page }) => {
    await page.addInitScript(fallback => {
      if (fallback === "unregistered") CSS.registerProperty = undefined;
      if (fallback === "no-waapi") Element.prototype.getAnimations = undefined;
    }, fallback);
    if (fallback === "reduced") await page.emulateMedia({ reducedMotion: "reduce" });
    await start(page, '<div id="panel" data-ae-present="opacity" hidden>Content</div>');
    await page.evaluate(() => $ae("panel").present.pop());
    await expect(page.locator("#panel")).toHaveCSS("opacity", "1");
    await expect(page.locator("#panel")).toHaveCSS("--ae-pop-progress", "1");
    await page.evaluate(() => $ae("panel").present.unpop());
    await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
    await expect(page.locator("#panel")).toHaveCSS("--ae-unpop-progress", "1");
  });
}

test("group preserves unspecified initial states and ignores irrelevant classes without duplicate events", async ({ page }) => {
  await start(page, `<div id="group" data-ae-present-group>
    <div id="a" data-ae-present data-ae-present-when="view-a" hidden>A</div>
    <div id="b" data-ae-present data-ae-present-when="view-b" hidden>B</div></div>`);
  await expect(page.locator("#a")).toHaveJSProperty("hidden", true);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await page.evaluate(() => {
    window.pops = 0;
    document.getElementById("group").addEventListener("AelluxJsBeforePop", () => window.pops++);
    document.getElementById("group").className = "unmatched";
  });
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => window.pops)).toBe(0);
  await page.evaluate(() => { document.getElementById("group").className = "view-b"; });
  await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
  await page.evaluate(() => document.getElementById("group").classList.add("irrelevant"));
  await page.waitForTimeout(80);
  expect(await page.evaluate(() => window.pops)).toBe(1);
  expect(await page.evaluate(async () => {
    document.getElementById("a").addEventListener("AelluxJsBeforePop", event => event.preventDefault(), { once: true });
    return $ae("group").present.show("a");
  })).toBe(false);
  await expect(page.locator("#b")).toHaveJSProperty("hidden", false);
});

test("group reentrant BeforePop selection and unmount cannot revive obsolete operations", async ({ page }) => {
  await start(page, panels);
  await page.evaluate(async () => {
    document.getElementById("b").addEventListener("AelluxJsBeforePop", () => {
      window.latest = $ae("group").present.show("c");
    }, { once: true });
    await $ae("group").present.show("b");
    await window.latest;
  });
  await expect(page.locator("#group")).toHaveAttribute("data-ae-present-active", "c");
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await expect(page.locator("#c")).toHaveJSProperty("hidden", false);
  await page.evaluate(async () => {
    window.obsolete = $ae("group").present.show("a");
    await AelluxJs.unmount(document.getElementById("group"), "present");
    await window.obsolete;
  });
  await expect(page.locator("#a")).toHaveJSProperty("hidden", false);
  await expect(page.locator("#c")).toHaveJSProperty("hidden", true);
  expect(await page.locator(".ae--popping,.ae--unpopping,.ae--will-change").count()).toBe(0);
});

test("progress shares elapsed-time sampling under low FPS and resets the opposite channel", async ({ page }) => {
  await start(page, `<div id="panel" data-ae-present="opacity" data-ae-maxfps="8" hidden
    style="--ae-pop-duration:350ms;--ae-unpop-duration:350ms;--ae-pop-ease:linear;--ae-unpop-ease:linear">Content</div>`,
  { cssMotionPropertyMaxFPS: 5 });
  const observation = await page.evaluate(async () => {
    const panel = document.getElementById("panel");
    const start = performance.now();
    await $ae("panel").present.pop();
    const elapsed = performance.now() - start;
    window.closing = $ae("panel").present.unpop();
    return { elapsed, reset: getComputedStyle(panel).getPropertyValue("--ae-pop-progress").trim() };
  });
  expect(observation.elapsed).toBeGreaterThanOrEqual(420);
  expect(observation.elapsed).toBeLessThan(2500);
  expect(observation.reset).toBe("0");
  await expect.poll(() => page.locator("#panel").evaluate(element =>
    Number(getComputedStyle(element).getPropertyValue("--ae-unpop-progress")))).toBeGreaterThan(0);
  await page.evaluate(() => window.closing);
  await expect(page.locator("#panel")).toHaveCSS("--ae-unpop-progress", "1");
});

for (const cssMotionController of [false, true]) {
  test(`overshooting easing keeps public progress bounded (controller=${cssMotionController})`, async ({ page }) => {
    await start(page, `<div id="panel" data-ae-present="opacity" hidden
      style="--ae-pop-duration:1000ms;--ae-pop-ease:cubic-bezier(.3,2,.7,2);--ae-pop-aellux-ease:backOut">Content</div>`,
    { cssMotionController });
    const samples = await page.evaluate(async () => {
      const panel = document.getElementById("panel");
      const samples = [];
      let sampling = true;
      const sample = () => {
        samples.push(Number(getComputedStyle(panel).getPropertyValue("--ae-pop-progress")));
        if (sampling) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
      await $ae("panel").present.pop();
      sampling = false;
      return samples;
    });
    expect(samples.some(value => value > 0 && value < 1)).toBe(true);
    expect(samples.every(value => value >= 0 && value <= 1)).toBe(true);
  });
}

test("a member removed or moved during selection cannot complete the former group request", async ({ page }) => {
  await start(page, `${panels}<div id="destination" data-ae-present-group></div>`);
  const removed = await page.evaluate(async () => {
    const pending = $ae("group").present.show("b");
    const member = document.getElementById("b");
    member.remove();
    await AelluxJs.unmount(member, "present");
    return pending;
  });
  expect(removed).toBe(false);
  const moved = await page.evaluate(async () => {
    const pending = $ae("group").present.show("c");
    document.getElementById("destination").append(document.getElementById("c"));
    return pending;
  });
  expect(moved).toBe(false);
  await page.evaluate(() => $ae("destination").present.show("c"));
  await expect(page.locator("#c")).toHaveJSProperty("hidden", false);
});

test("native touch activation of a hover toggle opens once", async ({ browser, browserName, baseURL }) => {
  test.skip(browserName === "firefox", "Playwright Firefox does not expose touchscreen.tap; synthetic touch pointer coverage runs separately.");
  const context = await browser.newContext({ hasTouch: true, baseURL });
  const page = await context.newPage();
  try {
    await start(page, `<button id="trigger" data-ae-trigger="toggle" data-ae-trigger-on="hover" data-ae-target="panel">Open</button>
      <div id="panel" data-ae-present="opacity" hidden>Content</div>`);
    await page.locator("#trigger").tap();
    await expect(page.locator("#panel")).toHaveAttribute("aria-expanded", "true");
    await page.waitForTimeout(200);
    await expect(page.locator("#panel")).toHaveJSProperty("hidden", false);
    await page.locator("#trigger").tap();
    await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
  } finally {
    await context.close();
  }
});

test("hover click suppression follows live trigger mode and target changes", async ({ page }) => {
  await start(page, `<button id="trigger" data-ae-trigger="toggle" data-ae-trigger-on="hover" data-ae-target="a">Open</button>
    <div id="a" data-ae-present="opacity" hidden>A</div><div id="b" data-ae-present="opacity" hidden>B</div>`);
  await page.locator("#trigger").hover();
  await expect(page.locator("#a")).toHaveAttribute("aria-expanded", "true");
  await page.locator("#trigger").evaluate(element => element.setAttribute("data-ae-target", "b"));
  await page.locator("#trigger").click();
  await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
  await page.mouse.move(900, 600);
  await page.locator("#trigger").evaluate(element => element.blur());
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
  await page.locator("#trigger").hover();
  await expect(page.locator("#b")).toHaveAttribute("aria-expanded", "true");
  await page.locator("#trigger").evaluate(element => element.setAttribute("data-ae-trigger-on", "click"));
  await page.locator("#trigger").click();
  await expect(page.locator("#b")).toHaveJSProperty("hidden", true);
});
