import { expect, test } from "@playwright/test";

async function start(page, markup, options = {}) {
  await page.goto("/tests/index.htm");
  await page.evaluate(markup => { document.body.innerHTML = markup; }, markup);
  await page.addScriptTag({ url: "/dist/aellux.min.js" });
  await page.evaluate(async options => {
    if (options.mode === "basic") {
      $ae.ext("present", { loadStyle: true });
      $ae.ext("feedback");
    }
    await new Promise(resolve => {
      $ae.on("Ready", resolve, { once: true });
      $ae.init({ mode: "full", skipGlobalMount: true, environment: "development", ...options });
    });
    await $ae.mount(document);
  }, options);
}

const panel = `<article id="panel" class="ae--pop" data-ae-present="opacity" data-ae-dismiss-on-click="none"
  style="--ae-pop-duration:160ms;--ae-dismiss-duration:160ms"><div id="content">Content</div></article>`;

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  const label = `${mode}, legacy=${forceLegacy}`;

  test(`Present effects run in every visible stable state without changing it (${label})`, async ({ page }) => {
    await start(page, `<div id="pop" data-ae-present="">Pop</div>
      <div id="unpop" data-ae-present="" class="ae--unpop">Unpop</div>
      <div id="dismissed" data-ae-present="" class="ae--dismissed">Dismissed</div>`, { mode, forceLegacy });
    const result = await page.evaluate(async () => {
      const results = [];
      for (const id of ["pop", "unpop", "dismissed"]) {
        const element = document.getElementById(id);
        const before = element.className;
        const operation = $ae(element).present.effect("shake");
        const active = element.classList.contains("ae--present-effect-shake");
        results.push({ active, result: await operation, restored: element.className === before });
      }
      return results;
    });
    expect(result).toEqual(Array(3).fill({ active: true, result: { status: "completed" }, restored: true }));
  });

  test(`Present defers latest effects, discards hidden effects and aborts replacements (${label})`, async ({ page }) => {
    await start(page, panel, { mode, forceLegacy });
    const result = await page.evaluate(async () => {
      const element = document.getElementById("panel"), target = document.getElementById("content");
      const api = $ae(element).present;
      const opening = api.pop();
      const old = api.effect("shake", target);
      const latest = api.effect("pulse", target);
      const during = target.className;
      await opening;
      const after = target.classList.contains("ae--present-effect-pulse");
      const latestResult = await latest;
      const closing = api.dismiss();
      const hiddenEffect = api.effect("shake", target);
      await closing;
      const hiddenResult = await hiddenEffect;
      const replacedOpening = api.pop();
      const obsolete = api.effect("yes", target);
      const reversed = api.unpop();
      await Promise.all([replacedOpening, reversed]);
      const obsoleteResult = await obsolete;
      return { during, after, old: await old, latest: latestResult, hidden: hiddenResult,
        obsolete: obsoleteResult, clean: !target.className.includes("present-effect-") };
    });
    expect(result).toEqual({ during: "", after: true, old: { status: "aborted" }, latest: { status: "completed" },
      hidden: { status: "skipped" }, obsolete: { status: "aborted" }, clean: true });
  });

  test(`Accepted transitions cancel effects while Before veto preserves them (${label})`, async ({ page }) => {
    await start(page, panel, { mode, forceLegacy });
    const result = await page.evaluate(async () => {
      const element = document.getElementById("panel"), target = document.getElementById("content");
      const api = $ae(element).present;
      const operation = api.effect("alert", target);
      element.addEventListener("AelluxJsBeforeDismiss", event => event.preventDefault(), { once: true });
      await api.dismiss();
      const vetoActive = target.classList.contains("ae--present-effect-alert");
      const closing = api.dismiss();
      const cancelledBeforeTransition = !target.classList.contains("ae--present-effect-alert");
      await closing;
      return { vetoActive, cancelledBeforeTransition, result: await operation };
    });
    expect(result).toEqual({ vetoActive: true, cancelledBeforeTransition: true, result: { status: "aborted" } });
  });

  test(`Feedback effects wait for pooled Present opening and keep targets inert (${label})`, async ({ page }) => {
    await start(page, `<section id="source" data-ae-feedback data-ae-present-target="pool"></section>
      <div id="pool" data-ae-present-group="2"><p id="one" data-ae-present="opacity" data-ae-dismiss-on-click="none" hidden>One</p>
      <p id="two" data-ae-present="opacity" data-ae-dismiss-on-click="none" hidden>Two</p></div>`, { mode, forceLegacy });
    const result = await page.evaluate(async () => {
      const source = document.getElementById("source");
      let concurrent = false;
      for (const id of ["one", "two"]) document.getElementById(id).addEventListener("AelluxJsPopping", event => {
        concurrent ||= event.target.classList.contains("ae--present-effect-shake");
      });
      const opened = new Promise(resolve => document.getElementById("two").addEventListener("AelluxJsPop", resolve, { once: true }));
      $ae.ext.feedback.error("Invalid", source, null, "shake");
      await opened;
      await new Promise(resolve => requestAnimationFrame(resolve));
      source.click();
      return { concurrent, message: document.getElementById("two").textContent,
        effect: document.getElementById("two").classList.contains("ae--present-effect-shake"),
        inert: !source.hasAttribute("aria-controls") && !source.hasAttribute("aria-expanded"),
        unusedHidden: document.getElementById("one").hidden };
    });
    expect(result).toEqual({ concurrent: false, message: "Invalid", effect: true, inert: true, unusedHidden: true });
  });
}

test("Present effect controls support keyboard, implicit targets, live actions and lifecycle", async ({ page }) => {
  await start(page, `<button id="isolated" data-ae-present-target="panel">Inert</button>
    <button id="external" data-ae-present-trigger="effect" data-ae-present-target="panel" data-ae-present-effect="shake">Effect</button>
    <div id="panel" data-ae-present="" data-ae-dismiss-on-click="none">
      <button id="internal" data-ae-present-trigger="effect" data-ae-present-effect="pulse">Internal</button></div>`);
  await page.locator("#isolated").click();
  await expect(page.locator("#isolated")).not.toHaveAttribute("aria-controls");
  await page.locator("#external").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#panel")).toHaveClass(/ae--present-effect-shake/);
  await page.locator("#internal").click();
  await expect(page.locator("#panel")).toHaveClass(/ae--present-effect-pulse/);
  const result = await page.evaluate(async () => {
    const element = document.getElementById("panel"), control = document.getElementById("external");
    const running = $ae(element).present.effect("alert");
    await $ae.unmount(element, "present");
    const clean = !element.className.includes("present-effect-");
    await $ae.mount(element, "present");
    control.setAttribute("data-ae-present-trigger", "dismiss");
    control.click();
    return { clean, result: await running };
  });
  expect(result).toEqual({ clean: true, result: { status: "aborted" } });
  await expect(page.locator("#panel")).toHaveJSProperty("hidden", true);
});

for (const cssMotionController of [true, false]) test(`Custom effects, transform targets and destroy (controlled=${cssMotionController})`, async ({ page }) => {
  await start(page, `<style>.ae--present-effect-glow{animation:glow 120ms}@keyframes glow{from{opacity:.3}to{opacity:1}}</style>
    <div id="panel" class="ae--pop" data-ae-present="transform" style="--ae-pop-transform:scale(.8)"><div id="content">Content</div></div>`, { cssMotionController });
  const result = await page.evaluate(async () => {
    const element = document.getElementById("panel"), target = document.getElementById("content");
    await $ae(element).present.pop();
    const transform = getComputedStyle(element).transform;
    const conflict = await $ae.ext.present.effect(element, "shake");
    const custom = await $ae(element).present.effect("glow", target);
    const pending = $ae(element).present.effect("alert", target);
    const transformPreserved = getComputedStyle(element).transform === transform;
    await $ae.ext.present.destroy();
    return { conflict, custom, pending: await pending, clean: !target.className.includes("present-effect-"),
      transformPreserved,
      warning: $ae.diagnostics.showHistory().some(entry => entry.code === 2033) };
  });
  expect(result).toEqual({ conflict: { status: "skipped" }, custom: { status: "completed" }, pending: { status: "aborted" },
    clean: true, transformPreserved: true, warning: true });
});

test("Reduced motion skips pending and immediate effects while Feedback stays semantic", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page, '<p id="panel" data-ae-present="" data-ae-feedback>Content</p>');
  const result = await page.evaluate(async () => {
    const element = document.getElementById("panel");
    $ae.ext.feedback.error("Invalid", element, null, "shake");
    const result = await $ae(element).present.effect("pulse");
    await Promise.resolve();
    return { result, semantic: element.classList.contains("ae--feedback-error"),
      clean: !element.className.includes("present-effect-"), message: element.textContent };
  });
  expect(result).toEqual({ result: { status: "skipped" }, semantic: true, clean: true, message: "Invalid" });
});

for (const forceLegacy of [false, true]) test(`Visible closing endpoints drain pending effects; unmount drops them (legacy=${forceLegacy})`, async ({ page }) => {
  await start(page, '<div id="panel" class="ae--pop" data-ae-present="opacity" style="--ae-from-opacity:1;--ae-dismiss-opacity:1;--ae-pop-duration:80ms;--ae-dismiss-duration:80ms">Content</div>', { forceLegacy });
  const result = await page.evaluate(async () => {
    const element = document.getElementById("panel"), api = $ae(element).present, results = [];
    for (const action of ["unpop", "dismiss"]) {
      await api.pop();
      const closing = api[action]();
      const pending = api.effect("shake");
      const deferred = !element.className.includes("present-effect-");
      await closing;
      results.push({ deferred, active: element.classList.contains("ae--present-effect-shake"), result: await pending });
    }
    const opening = api.pop();
    const pending = api.effect("pulse");
    await $ae.unmount(element, "present");
    await opening;
    return { results, pending: await pending, clean: !element.className.includes("present-effect-") };
  });
  expect(result).toEqual({ results: Array(2).fill({ deferred: true, active: true, result: { status: "completed" } }),
    pending: { status: "aborted" }, clean: true });
});

test("Feedback tied to a replaced opening cannot animate the later closing", async ({ page }) => {
  await start(page, '<div id="panel" data-ae-present="opacity" data-ae-feedback hidden>Content</div>');
  const result = await page.evaluate(async () => {
    const element = document.getElementById("panel");
    element.setAttribute("data-ae-present-target", "panel");
    $ae.ext.feedback.error("Invalid", element, null, "shake");
    await $ae(element).present.dismiss();
    return { clean: !element.className.includes("present-effect-"), hidden: element.hidden, message: element.textContent };
  });
  expect(result).toEqual({ clean: true, hidden: true, message: "Invalid" });
});

test("Reduced motion cancels a running custom native effect", async ({ page }) => {
  await start(page, '<style>.ae--present-effect-glow{animation:glow 10s}@keyframes glow{from{opacity:.3}to{opacity:1}}</style><div id="panel" data-ae-present="">Content</div>', { cssMotionController: false });
  await page.evaluate(() => { window.effect = $ae("panel").present.effect("glow"); });
  await expect(page.locator("#panel")).toHaveClass(/ae--present-effect-glow/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#panel")).not.toHaveClass(/ae--present-effect-glow/);
  expect(await page.evaluate(() => window.effect)).toEqual({ status: "skipped" });
});

for (const forceLegacy of [false, true]) test(`Pooled Feedback keeps effects independent for simultaneous publications (legacy=${forceLegacy})`, async ({ page }) => {
  await start(page, `<section id="source" data-ae-feedback data-ae-present-target="pool"></section>
    <div id="pool" data-ae-present-group="2">
      <p id="one" data-ae-present="opacity" data-ae-dismiss-on-click="none" hidden></p>
      <p id="two" data-ae-present="opacity" data-ae-dismiss-on-click="none" hidden></p></div>`, { forceLegacy });
  const result = await page.evaluate(async () => {
    const source = document.getElementById("source");
    const members = ["one", "two"].map(id => document.getElementById(id));
    const opened = members.map(member => new Promise(resolve => member.addEventListener("AelluxJsPop", resolve, { once: true })));
    $ae.ext.feedback.error("First", source, null, "shake");
    $ae.ext.feedback.success("Second", source, null, "pulse");
    await Promise.all(opened);
    await new Promise(resolve => requestAnimationFrame(resolve));
    return members.map(member => ({ message: member.textContent,
      shake: member.classList.contains("ae--present-effect-shake"),
      pulse: member.classList.contains("ae--present-effect-pulse") }));
  });
  expect(result).toEqual([{ message: "Second", shake: false, pulse: true }, { message: "First", shake: true, pulse: false }]);
});
