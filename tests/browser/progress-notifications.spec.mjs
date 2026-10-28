import { expect, test } from "@playwright/test";

async function start(page, markup, { mode = "full", forceLegacy = false, missing = [] } = {}) {
  await page.goto("/tests/index.htm");
  await page.evaluate(({ markup, missing }) => {
    document.body.innerHTML = markup;
    for (const tag of missing) {
      const ctor = window[tag === "progress" ? "HTMLProgressElement" : "HTMLMeterElement"];
      Object.defineProperty(ctor.prototype, tag === "progress" ? "position" : "optimum",
        { configurable: true, value: undefined });
    }
  }, { markup, missing });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ mode, forceLegacy }) => new Promise(resolve => {
    if (mode === "basic") for (const name of ["progress", "present", "feedback"]) AelluxJs.ext(name);
    AelluxJs.on("Ready", resolve, { once: true });
    AelluxJs.init({ mode, forceLegacy });
  }), { mode, forceLegacy });
}

const notices = `<section id="source" data-ae-feedback data-ae-present-target="group"></section>
<div id="group" data-ae-present-group>
${[1, 2, 3].map(n => `<article id="n${n}" data-ae-present data-ae-auto-unpop="5000"
data-ae-unpop-on-outside="false" hidden><b>Keep child</b><progress max="100" value="0"
data-ae-progress-target="n${n}"></progress></article>`).join("")}
</div>`;

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  test(`Popping resets progress without starting the close timer (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, '<article id="notice" data-ae-present="opacity" data-ae-auto-unpop="1000" hidden>' +
      '<progress max="100" value="77" data-ae-progress-target="notice"></progress></article>', { mode, forceLegacy });
    await page.clock.install();
    expect(await page.evaluate(async () => {
      window.resetSamples = [];
      const notice = document.getElementById("notice");
      notice.addEventListener("AelluxJsProgress", e => window.resetSamples.push(e.detail));
      notice.addEventListener("AelluxJsBeforePop", e => e.preventDefault(), { once: true });
      await $ae(notice).present.pop();
      return { samples: window.resetSamples, value: notice.querySelector("progress").value };
    })).toEqual({ samples: [], value: 77 });
    await page.evaluate(() => {
      const notice = document.getElementById("notice");
      notice.addEventListener("AelluxJsPopping", () => {
        window.valueAtPopping = notice.querySelector("progress").value;
      });
      // Hold opening completion independently of browser animation clocks.
      AelluxJs.motion = { ...AelluxJs.motion, run(element, options) {
        options.apply();
        return new Promise(resolve => {
          window.finishOpening = () => resolve({ status: "completed" });
        });
      } };
      window.openNotice = $ae(notice).present.pop();
    });
    await page.clock.runFor(150);
    expect(await page.evaluate(() => ({ value: window.valueAtPopping, samples: window.resetSamples })))
      .toMatchObject({ value: 0, samples: [{ value: 0, max: 1, status: "running", elapsedMs: 0, durationMs: 1000 }] });
    await page.clock.runFor(1500);
    expect(await page.locator("#notice progress").evaluate(p => p.value)).toBe(0);
    expect(await page.locator("#notice").evaluate(n => n.hidden)).toBe(false);
    const zeros = await page.evaluate(async () => {
      window.finishOpening();
      await window.openNotice;
      return window.resetSamples.map(s => s.value);
    });
    expect(zeros).toEqual([0, 0]);
    await page.clock.runFor(400);
    expect(await page.locator("#notice progress").evaluate(p => p.value)).toBeGreaterThan(35);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("notice")));
  });

  test(`native controls, generic producer and lifecycle (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, `<div id="producer"></div><div id="other"></div>
      <progress id="p" max="40" data-ae-progress-target="#producer"></progress>
      <meter id="m" min="-10" max="20" low="0" high="15" optimum="10" value="5"></meter>`, { mode, forceLegacy });
    expect(await page.evaluate(() => {
      const p = document.getElementById("p"), m = document.getElementById("m");
      const before = p.position;
      const send = detail => AelluxJs.dispatchFrom(document.getElementById("producer"), "Progress", { bubbles: false, detail });
      send({ value: 1, max: 4 });
      const value = p.value;
      for (const detail of [{ value: NaN, max: 1 }, { value: Infinity, max: 1 }, { value: -1, max: 1 },
        { value: 1, max: 0 }, { value: 2, max: 1 }, { value: "1", max: 2 }]) send(detail);
      return { before, value, after: p.value, max: p.max, meter: [m.min, m.max, m.low, m.high, m.optimum, m.value],
        fallback: document.querySelectorAll("[data-ae-progress-fallback]").length };
    })).toEqual({ before: -1, value: 10, after: 10, max: 40, meter: [-10, 20, 0, 15, 10, 5], fallback: 0 });
    await page.locator("#p").evaluate(p => p.setAttribute("data-ae-progress-target", "other"));
    await expect.poll(() => page.evaluate(() => {
      AelluxJs.dispatchFrom(document.getElementById("other"), "Progress", { bubbles: false, detail: { value: 1, max: 2 } });
      return document.getElementById("p").value;
    })).toBe(20);
    expect(await page.evaluate(async () => {
      const p = document.getElementById("p");
      AelluxJs.dispatchFrom(document.getElementById("producer"), "Progress", { bubbles: false, detail: { value: 1, max: 1 } });
      const retargeted = p.value;
      await AelluxJs.unmount(p, "progress");
      AelluxJs.dispatchFrom(document.getElementById("other"), "Progress", { detail: { value: 1, max: 1 } });
      return { retargeted, position: p.position, max: p.max, valueAttribute: p.getAttribute("value") };
    })).toEqual({ retargeted: 20, position: -1, max: 40, valueAttribute: null });
  });

  test(`notification rotation, preparation, reuse and exclusive selection (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, notices, { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const source = document.getElementById("source"), group = document.getElementById("group");
      const before = [];
      group.addEventListener("AelluxJsBeforePop", event => before.push([event.target.id, event.target.textContent]));
      AelluxJs.ext.feedback.success("First", source);
      AelluxJs.ext.feedback.error("Second", source);
      AelluxJs.ext.feedback.warning("Third", source);
      await new Promise(resolve => setTimeout(resolve, 100));
      const messages = Array.from(group.children).map(e => [e.id, e.textContent, e.hidden]);
      AelluxJs.ext.feedback.announce("Fourth", source);
      await new Promise(resolve => setTimeout(resolve, 100));
      const order = Array.from(group.children).map(e => e.id);
      const reused = document.getElementById("n3");
      const classes = [reused.classList.contains("ae--feedback-success"), reused.classList.contains("ae--feedback-announce")];
      const exclusive = await $ae(group).present.show("n2");
      return { before: before.map(([id, text]) => [id, text.replace("Keep child", "").trim()]),
        messages: messages.map(([id, text, hidden]) => [id, text.replace("Keep child", "").trim(), hidden]),
        order, classes, exclusive, visible: Array.from(group.children).filter(e => !e.hidden).map(e => e.id),
        selected: $ae(group).present.selected()?.id, children: group.querySelectorAll("progress,b").length };
    })).toEqual({ before: [["n3", "First"], ["n2", "Second"], ["n1", "Third"], ["n3", "Fourth"]],
      messages: [["n1", "Third", false], ["n2", "Second", false], ["n3", "First", false]],
      order: ["n3", "n1", "n2"], classes: [false, true], exclusive: true, visible: ["n2"], selected: "n2", children: 6 });
  });

  test(`auto-unpop clock, cancellation, restart and veto (${mode}, legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, notices, { mode, forceLegacy });
    await page.clock.install();
    await page.evaluate(async () => {
      window.samples = [];
      window.ancestorProgress = 0;
      const n = document.getElementById("n3");
      document.body.addEventListener("AelluxJsProgress", () => window.ancestorProgress++);
      n.addEventListener("AelluxJsProgress", e => window.samples.push({ ...e.detail, bubbles: e.bubbles, cancelable: e.cancelable }));
      window.opening = $ae("group").present.popNext();
    });
    await page.clock.runFor(50);
    await page.evaluate(() => window.opening);
    expect(await page.evaluate(() => window.samples[0])).toMatchObject({ value: 0, max: 1, status: "running", bubbles: false, cancelable: false });
    await page.clock.runFor(2450);
    expect(await page.locator("#n3 progress").evaluate(p => p.value)).toBeGreaterThan(45);
    await page.evaluate(() => { window.closing = $ae("n3").present.unpop(); });
    await page.clock.runFor(50);
    await page.evaluate(() => window.closing);
    const count = await page.evaluate(() => window.samples.length);
    await page.clock.runFor(6000);
    expect(await page.evaluate(() => window.samples.length)).toBe(count);
    await page.evaluate(() => {
      window.restartSampleIndex = window.samples.length;
      window.reopening = $ae("n3").present.pop();
    });
    await page.clock.runFor(50);
    const restarted = await page.evaluate(async () => {
      await window.reopening;
      return window.samples.slice(window.restartSampleIndex);
    });
    expect(restarted.slice(0, 2).map(sample => sample.value)).toEqual([0, 0]);
    await page.evaluate(() => document.getElementById("n3").addEventListener("AelluxJsBeforeUnpop", e => e.preventDefault()));
    await page.clock.runFor(5100);
    expect(await page.evaluate(() => ({ last: window.samples.at(-1), ancestor: window.ancestorProgress,
      hidden: document.getElementById("n3").hidden }))).toMatchObject({ last: { value: 1, status: "completed" }, ancestor: 0, hidden: false });
    const completedCount = await page.evaluate(() => window.samples.length);
    await page.clock.runFor(6000);
    expect(await page.evaluate(() => window.samples.length)).toBe(completedCount);
    await page.evaluate(() => document.getElementById("n3").setAttribute("data-ae-auto-unpop", "0"));
    await page.clock.runFor(50);
    expect(await page.evaluate(() => window.samples.slice(-2).map(e => [e.value, e.status])))
      .toEqual([[0, "running"], [1, "completed"]]);
    await page.evaluate(() => AelluxJs.unmount(document.getElementById("group")));
    const unmountedCount = await page.evaluate(() => window.samples.length);
    await page.clock.runFor(6000);
    expect(await page.evaluate(() => window.samples.length)).toBe(unmountedCount);
  });
}

for (const missing of [["progress"], ["meter"], ["progress", "meter"]]) {
  test(`partial native capability fallback: ${missing.join("+")}`, async ({ page }) => {
    const requests = [];
    page.on("request", request => requests.push(new URL(request.url()).pathname));
    await start(page, '<progress id="p">Original</progress><meter id="m" min="10" max="50" value="30">Measure</meter>', { missing });
    expect(await page.evaluate(() => AelluxJs.diagnostics.legacy)).toBe(true);
    for (const tag of ["progress", "meter"]) {
      await expect(page.locator(`${tag}[data-ae-progress-fallback]`)).toHaveCount(missing.includes(tag) ? 1 : 0);
    }
    if (missing.includes("progress")) {
      expect(await page.locator("#p").evaluate(p => ({ value: p.value, max: p.max, position: p.position, aria: p.getAttribute("aria-valuenow") })))
        .toEqual({ value: 0, max: 1, position: -1, aria: null });
      await page.locator("#p").evaluate(p => { p.max = 20; p.value = 10; });
      await expect(page.locator("#p")).toHaveAttribute("aria-valuenow", "10");
      await page.locator("#p").evaluate(p => p.setAttribute("value", "80"));
      await expect(page.locator("#p")).toHaveAttribute("aria-valuenow", "20");
    }
    if (missing.includes("meter")) {
      expect(await page.locator("#m").evaluate(m => [m.min, m.max, m.value, m.low, m.high, m.optimum])).toEqual([10, 50, 30, 10, 50, 30]);
      await page.locator("#m").evaluate(m => { m.low = 20; m.high = 40; m.optimum = 15; m.value = 45; });
      await expect(page.locator("#m")).toHaveAttribute("aria-valuenow", "45");
    }
    expect(requests.filter(path => /progress.*\.(js|css)$/.test(path))).toEqual(["/dist/aellux.ext.progress.legacy.js"]);
    expect(await page.evaluate(async () => {
      await AelluxJs.unmount(document, "progress");
      return { text: [document.getElementById("p").textContent, document.getElementById("m").textContent],
        markers: document.querySelectorAll("[data-ae-progress-fallback]").length };
    })).toEqual({ text: ["Original", "Measure"], markers: 0 });
  });
}

test("Full loads Progress only for dynamic controls and restores fallback on remount", async ({ page }) => {
  const requests = [];
  page.on("request", request => requests.push(new URL(request.url()).pathname));
  await start(page, '<div id="producer"></div>', { missing: ["progress", "meter"] });
  expect(requests.some(path => path.includes("ext.progress"))).toBe(false);
  expect(await page.evaluate(async () => {
    const subtree = document.createElement("section");
    subtree.innerHTML = '<progress max="80" value="4" data-ae-progress-target="producer">Original</progress><meter value=".5">Half</meter>';
    document.body.appendChild(subtree);
    await AelluxJs.mount(subtree);
    const p = subtree.firstChild;
    const emit = () => AelluxJs.dispatchFrom(document.getElementById("producer"), "Progress",
      { bubbles: false, detail: { value: 1, max: 2 } });
    emit();
    const value = p.value;
    const fallback = subtree.querySelectorAll("[data-ae-progress-fallback]").length;
    await AelluxJs.unmount(subtree);
    const restored = p.getAttribute("value");
    await AelluxJs.mount(subtree);
    emit();
    const remounted = p.value;
    await AelluxJs.destroyExtensions("progress");
    emit();
    return { value, fallback, restored, remounted, final: p.getAttribute("value"), text: p.textContent,
      markers: subtree.querySelectorAll("[data-ae-progress-fallback]").length };
  })).toEqual({ value: 40, fallback: 2, restored: "4", remounted: 40, final: "4", text: "Original", markers: 0 });
  expect(requests.filter(path => /ext.progress.*\.js$/.test(path))).toEqual(["/dist/aellux.ext.progress.legacy.js"]);
});

test("missing constructors select independent Legacy fallbacks without patching native prototypes", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = '<progress id="p"></progress><meter id="m"></meter>';
    window.originalProgressValue = Object.getOwnPropertyDescriptor(HTMLProgressElement.prototype, "value").get;
    window.originalMeterValue = Object.getOwnPropertyDescriptor(HTMLMeterElement.prototype, "value").get;
    window.HTMLProgressElement = undefined;
    window.HTMLMeterElement = undefined;
  });
  await page.addScriptTag({ url: "/dist/aellux.min.js" });
  await page.evaluate(() => new Promise(resolve => {
    AelluxJs.on("Ready", resolve, { once: true });
    AelluxJs.init();
  }));
  expect(await page.evaluate(() => {
    const p = document.getElementById("p"), m = document.getElementById("m");
    p.value = .5; m.value = .25;
    return { values: [p.value, m.value], fallback: document.querySelectorAll("[data-ae-progress-fallback]").length,
      progressPrototype: Object.getOwnPropertyDescriptor(Object.getPrototypeOf(p), "value").get === window.originalProgressValue,
      meterPrototype: Object.getOwnPropertyDescriptor(Object.getPrototypeOf(m), "value").get === window.originalMeterValue };
  })).toEqual({ values: [.5, .25], fallback: 2, progressPrototype: true, meterPrototype: true });
});

for (const forceLegacy of [false, true]) {
  test(`independent timers, config changes, removal and destroy (legacy=${forceLegacy})`, async ({ page }) => {
    await start(page, notices, { forceLegacy });
    await page.clock.install();
    await page.evaluate(() => { window.first = $ae("group").present.popNext(); });
    await page.clock.runFor(50);
    await page.evaluate(() => window.first);
    await page.clock.runFor(1950);
    await page.evaluate(() => { window.second = $ae("group").present.popNext(); });
    await page.clock.runFor(50);
    await page.evaluate(() => window.second);
    await page.clock.runFor(3100);
    expect(await page.locator("#n3").evaluate(e => e.hidden)).toBe(true);
    expect(await page.locator("#n2").evaluate(e => e.hidden)).toBe(false);
    await page.evaluate(() => document.getElementById("n2").removeAttribute("data-ae-auto-unpop"));
    await page.clock.runFor(6000);
    expect(await page.locator("#n2").evaluate(e => e.hidden)).toBe(false);
    await page.evaluate(() => {
      window.emissions = 0;
      document.getElementById("n2").addEventListener("AelluxJsProgress", () => window.emissions++);
      document.getElementById("n2").setAttribute("data-ae-auto-unpop", "10s");
    });
    await page.clock.runFor(250);
    expect(await page.evaluate(() => window.emissions)).toBeGreaterThan(1);
    await page.evaluate(() => document.getElementById("n2").remove());
    const count = await page.evaluate(() => window.emissions);
    await page.clock.runFor(15000);
    expect(await page.evaluate(() => window.emissions)).toBe(count);
    await page.evaluate(() => { window.third = $ae("group").present.popNext(); });
    await page.clock.runFor(50);
    await page.evaluate(() => window.third);
    await page.evaluate(() => {
      document.getElementById("n1").addEventListener("AelluxJsProgress", () => window.emissions++);
    });
    await page.clock.runFor(250);
    const beforeDestroy = await page.evaluate(() => window.emissions);
    expect(beforeDestroy).toBeGreaterThan(count);
    const afterDestroy = await page.evaluate(async () => {
      await AelluxJs.destroyExtensions("present");
      return window.emissions;
    });
    await page.clock.runFor(6000);
    expect(await page.evaluate(() => window.emissions)).toBe(afterDestroy);
  });
}

test("dynamic groups retain accumulation until declarative selection changes", async ({ page }) => {
  await start(page, notices);
  expect(await page.evaluate(async () => {
    const group = document.getElementById("group");
    await $ae(group).present.popNext();
    const dynamic = document.createElement("article");
    dynamic.id = "new"; dynamic.hidden = true; dynamic.setAttribute("data-ae-present", "");
    group.appendChild(dynamic);
    await AelluxJs.mount(dynamic);
    const next = await $ae(group).present.popNext();
    const accumulated = [document.getElementById("n3").hidden, dynamic.hidden];
    dynamic.remove();
    document.getElementById("n1").setAttribute("data-ae-present-when", "choose-first");
    group.classList.add("choose-first");
    await new Promise(resolve => setTimeout(resolve, 100));
    return { next: next.id, accumulated, selected: $ae(group).present.selected()?.id,
      visible: Array.from(group.children).filter(e => !e.hidden).map(e => e.id) };
  })).toEqual({ next: "new", accumulated: [false, false], selected: "n1", visible: ["n1"] });
});

test("popNext ignores wrappers, nested groups, unmounted members and handles veto", async ({ page }) => {
  await start(page, `<div id="group" data-ae-present-group><div id="a" data-ae-present hidden>A</div>
    <div><div id="wrapped" data-ae-present hidden>W</div></div>
    <div id="nested" data-ae-present-group><div id="inner" data-ae-present hidden>I</div></div>
    <div id="b" data-ae-present hidden>B</div><div id="unmounted" data-ae-present hidden>U</div></div>`);
  expect(await page.evaluate(async () => {
    await AelluxJs.unmount(document.getElementById("unmounted"), "present");
    document.getElementById("b").addEventListener("AelluxJsBeforePop", event => event.preventDefault(), { once: true });
    const veto = await $ae("group").present.popNext();
    const jobs = [$ae("group").present.popNext(), $ae("group").present.popNext()];
    const reserved = Array.from(document.getElementById("group").children).map(e => e.id || "wrapper");
    return { veto, reserved, opened: (await Promise.all(jobs)).map(e => e?.id),
      excluded: ["wrapped", "inner", "unmounted"].map(id => document.getElementById(id).hidden) };
  })).toEqual({ veto: null, reserved: ["b", "a", "wrapper", "nested", "unmounted"], opened: ["a", "b"], excluded: [true, true, true] });
});

test("vetoed exclusive selection preserves accumulated members and later selection can succeed", async ({ page }) => {
  await start(page, notices);
  expect(await page.evaluate(async () => {
    await $ae("group").present.popNext();
    await $ae("group").present.popNext();
    const n1 = document.getElementById("n1");
    n1.addEventListener("AelluxJsBeforePop", event => event.preventDefault(), { once: true });
    const rejected = await $ae("group").present.show("n1");
    await new Promise(resolve => setTimeout(resolve, 50));
    const visible = Array.from(document.getElementById("group").children).filter(e => !e.hidden).map(e => e.id);
    const accepted = await $ae("group").present.show("n1");
    return { rejected, visible, accepted, selected: $ae("group").present.selected()?.id };
  })).toEqual({ rejected: false, visible: ["n2", "n3"], accepted: true, selected: "n1" });
});

test("reentrant group change reserves a different notification before opening", async ({ page }) => {
  await start(page, notices);
  expect(await page.evaluate(async () => {
    const group = document.getElementById("group");
    await $ae(group).present.show("n1");
    let nested;
    group.addEventListener("AelluxJsPresentGroupChange", () => {
      nested = $ae(group).present.popNext();
    }, { once: true });
    const outer = $ae(group).present.popNext();
    const order = Array.from(group.children).map(e => e.id);
    return { order, results: (await Promise.all([outer, nested])).map(e => e?.id) };
  })).toEqual({ order: ["n2", "n3", "n1"], results: ["n3", "n2"] });
});

test("empty pooled feedback reuses one text node and preserves child controls", async ({ page }) => {
  await start(page, '<section id="source" data-ae-feedback data-ae-present-target="g"></section>' +
    '<div id="g" data-ae-present-group><article id="n" data-ae-present hidden><b>Child</b><progress></progress></article></div>');
  expect(await page.evaluate(() => {
    const source = document.getElementById("source"), member = document.getElementById("n");
    for (let i = 0; i < 20; i++) AelluxJs.ext.feedback.success("", source);
    AelluxJs.ext.feedback.success("Final", source);
    return { textNodes: Array.from(member.childNodes).filter(n => n.nodeType === 3).length,
      text: member.textContent, controls: member.querySelectorAll("b,progress").length };
  })).toEqual({ textNodes: 1, text: "ChildFinal", controls: 2 });
});

test("late producer resolution supports multiple consumers and diagnoses missing IDs", async ({ page }) => {
  await start(page, '<progress id="p" max="40" data-ae-progress-target="late"></progress>' +
    '<progress id="second" max="100" value="5" data-ae-progress-target="#late"></progress>' +
    '<meter id="m" value=".5" data-ae-progress-target="late"></meter>');
  expect(await page.evaluate(() => AelluxJs.diagnostics.showHistory().some(e => e.code === 2011))).toBe(true);
  expect(await page.evaluate(async () => {
    const producer = document.createElement("div"); producer.id = "late"; document.body.appendChild(producer);
    await AelluxJs.mountManager.update(document, "progress");
    AelluxJs.dispatchFrom(producer, "Progress", { bubbles: false, cancelable: false, detail: { value: 1, max: 4 } });
    const result = { values: [document.getElementById("p").value, document.getElementById("second").value],
      meter: document.getElementById("m").value };
    await AelluxJs.unmount(document, "progress");
    result.restored = [document.getElementById("p").getAttribute("value"), document.getElementById("second").value];
    return result;
  })).toEqual({ values: [10, 25], meter: .5, restored: [null, 5] });
});

test("initially visible Present emits zero without Progress or Feedback installed", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = '<article id="initial" data-ae-present data-ae-auto-unpop="60000">Visible</article>';
    window.initialSamples = [];
    document.getElementById("initial").addEventListener("AelluxJsProgress", event => window.initialSamples.push(event.detail));
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => new Promise(resolve => {
    AelluxJs.ext("present");
    AelluxJs.on("Ready", resolve, { once: true });
    AelluxJs.init({ mode: "basic" });
  }));
  expect(await page.evaluate(() => ({ first: window.initialSamples[0],
    registered: Object.keys(AelluxJs.registry.ext) }))).toMatchObject({
      first: { value: 0, max: 1, status: "running", elapsedMs: 0, durationMs: 60000 }, registered: ["present"]
    });
  await page.clock.install();
  await page.evaluate(() => { window.initialClose = $ae("initial").present.unpop(); });
  await page.clock.runFor(50);
  await page.evaluate(() => window.initialClose);
  const count = await page.evaluate(() => window.initialSamples.length);
  await page.clock.runFor(61000);
  expect(await page.evaluate(() => window.initialSamples.length)).toBe(count);
});
