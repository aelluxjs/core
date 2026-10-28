import { expect, test } from "@playwright/test";

const groupMarkup = (limit = "", id = "pool") => `<div id="${id}" data-ae-present-group="${limit}">
${["a", "b", "c", "d"].map(key => `<article id="${id}-${key}" data-ae-present hidden>${key}</article>`).join("")}
</div>`;

async function start(page, markup, options) {
  await page.goto("/tests/index.htm");
  await page.evaluate(markup => { document.body.innerHTML = markup; }, markup);
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(options => new Promise(resolve => {
    if (options.mode === "basic") AelluxJs.ext("present");
    AelluxJs.on("Ready", resolve, { once: true });
    AelluxJs.init(options);
  }), options);
}

for (const mode of ["basic", "full"]) for (const forceLegacy of [false, true]) {
  const label = `${mode}, legacy=${forceLegacy}`;

  test(`capacity defaults, positive limits and HTML pool bounds (${label})`, async ({ page }) => {
    const limits = ["", "1", "2", "3", "99"];
    await start(page, limits.map((limit, n) => groupMarkup(limit, `g${n}`)).join(""), { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const results = [];
      for (let n = 0; n < 5; n++) {
        const group = document.getElementById(`g${n}`);
        const opened = [];
        let unpops = 0;
        group.addEventListener("AelluxJsBeforeUnpop", e => { unpops++; e.preventDefault(); });
        for (let i = 0; i < 5; i++) opened.push((await $ae(group).present.popNext()).id.split("-").at(-1));
        results.push({ opened, visible: Array.from(group.children).filter(e => !e.hidden).map(e => e.textContent).sort(), unpops });
      }
      return results;
    })).toEqual([
      { opened: ["d", "d", "d", "d", "d"], visible: ["d"], unpops: 0 },
      { opened: ["d", "d", "d", "d", "d"], visible: ["d"], unpops: 0 },
      { opened: ["d", "c", "d", "c", "d"], visible: ["c", "d"], unpops: 0 },
      { opened: ["d", "c", "b", "d", "c"], visible: ["b", "c", "d"], unpops: 0 },
      { opened: ["d", "c", "b", "a", "d"], visible: ["a", "b", "c", "d"], unpops: 0 }
    ]);
  });

  test(`invalid capacity warns once per value and falls back to one (${label})`, async ({ page }) => {
    const invalid = ["0", "-1", "1.5", "NaN", "Infinity", "wrong", "2e0", "+2", "9007199254740992"];
    await start(page, invalid.map((value, n) => groupMarkup(value, `g${n}`)).join(""), { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const before = AelluxJs.diagnostics.showHistory().filter(e => e.code === 2026).length;
      const reused = [];
      for (let n = 0; n < 9; n++) {
        const controller = $ae(`g${n}`).present;
        const first = await controller.popNext();
        reused.push(first === await controller.popNext());
      }
      return { before, after: AelluxJs.diagnostics.showHistory().filter(e => e.code === 2026).length, reused };
    })).toEqual({ before: 9, after: 9, reused: Array(9).fill(true) });
  });

  test(`a released member is used before reusing another open member (${label})`, async ({ page }) => {
    await start(page, groupMarkup("4"), { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const controller = $ae("pool").present;
      const first = await controller.popNext();
      const second = await controller.popNext();
      await controller.popNext();
      await controller.popNext();
      await $ae(second).present.unpop();
      const unpops = [];
      document.getElementById("pool").addEventListener("AelluxJsBeforeUnpop", e => unpops.push(e.target.id));
      const next = await controller.popNext();
      return { next: next.id, firstVisible: !first.hidden, unpops };
    })).toEqual({ next: "pool-c", firstVisible: true, unpops: [] });
  });

  test(`consecutive and reentrant reservations respect capacity (${label})`, async ({ page }) => {
    await start(page, groupMarkup("2") + groupMarkup("1", "single"), { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const group = document.getElementById("pool");
      const reserved = [];
      const jobs = Array.from({ length: 8 }, () => $ae(group).present.popNext(e => reserved.push(e.id)));
      await Promise.all(jobs);
      let inner;
      const outer = $ae("single").present.popNext(() => { inner = $ae("single").present.popNext(); });
      return { reserved, visible: Array.from(group.children).filter(e => !e.hidden).map(e => e.id).sort(),
        reentrant: (await Promise.all([outer, inner])).map(e => e?.id || null) };
    })).toEqual({ reserved: ["pool-d", "pool-c", "pool-d", "pool-c", "pool-d", "pool-c", "pool-d", "pool-c"],
      visible: ["pool-c", "pool-d"], reentrant: [null, "single-d"] });
  });

  test(`vetoed reuse preserves visibility and age; show stays exclusive (${label})`, async ({ page }) => {
    await start(page, groupMarkup("2"), { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const group = document.getElementById("pool"), controller = $ae(group).present;
      const oldest = await controller.popNext();
      await controller.popNext();
      oldest.addEventListener("AelluxJsBeforePop", e => e.preventDefault(), { once: true });
      const veto = await controller.popNext();
      const visibleBefore = Array.from(group.children).filter(e => !e.hidden).map(e => e.id).sort();
      const next = await controller.popNext();
      const exclusive = await controller.show("pool-a");
      return { veto, visibleBefore, next: next.id, exclusive, selected: controller.selected().id,
        visibleAfter: Array.from(group.children).filter(e => !e.hidden).map(e => e.id) };
    })).toEqual({ veto: null, visibleBefore: ["pool-c", "pool-d"], next: "pool-d", exclusive: true,
      selected: "pool-a", visibleAfter: ["pool-a"] });
  });

  test(`capacity changes preserve existing presentations and invalidate preflight (${label})`, async ({ page }) => {
    await start(page, groupMarkup("3"), { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const group = document.getElementById("pool"), controller = $ae(group).present;
      for (let n = 0; n < 3; n++) await controller.popNext();
      group.setAttribute("data-ae-present-group", "1");
      const reused = await controller.popNext();
      const retained = Array.from(group.children).filter(e => !e.hidden).length;
      await $ae("pool-b").present.unpop(); await $ae("pool-c").present.unpop();
      group.setAttribute("data-ae-present-group", "2");
      document.getElementById("pool-a").addEventListener("AelluxJsBeforePop", () => {
        group.setAttribute("data-ae-present-group", "1");
      }, { once: true });
      const canceled = await controller.popNext();
      const after = await controller.popNext();
      return { reused: reused.id, retained, canceled, after: after.id,
        visible: Array.from(group.children).filter(e => !e.hidden).map(e => e.id) };
    })).toEqual({ reused: "pool-d", retained: 3, canceled: null, after: "pool-d", visible: ["pool-d"] });
  });

  test(`direct member actions preserve the limit and update reuse age (${label})`, async ({ page }) => {
    await start(page, groupMarkup("2"), { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const controller = $ae("pool").present;
      await controller.popNext(); await controller.popNext();
      const refused = await $ae("pool-a").present.pop();
      await $ae("pool-d").present.pop();
      const oldest = await controller.popNext();
      return { refused, oldest: oldest.id, hidden: document.getElementById("pool-a").hidden,
        visible: Array.from(document.getElementById("pool").children).filter(e => !e.hidden).map(e => e.id).sort() };
    })).toEqual({ refused: false, oldest: "pool-c", hidden: true, visible: ["pool-c", "pool-d"] });
  });

  test(`nested groups have independent capacities (${label})`, async ({ page }) => {
    await start(page, groupMarkup("1") + groupMarkup("2", "nested"), { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const parent = document.getElementById("pool"), nested = document.getElementById("nested");
      parent.appendChild(nested);
      const first = await $ae(parent).present.popNext();
      const again = await $ae(parent).present.popNext();
      await $ae(nested).present.popNext(); await $ae(nested).present.popNext();
      return { reused: first === again, parent: Array.from(parent.children).filter(e => e.hasAttribute("data-ae-present") && !e.hidden).length,
        nested: Array.from(nested.children).filter(e => !e.hidden).length };
    })).toEqual({ reused: true, parent: 1, nested: 2 });
  });

  test(`a rejected reuse preserves an earlier pending opening (${label})`, async ({ page }) => {
    await start(page, groupMarkup("1"), { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const controller = $ae("pool").present;
      const first = controller.popNext();
      document.getElementById("pool-d").addEventListener("AelluxJsBeforePop", e => e.preventDefault(), { once: true });
      const rejected = controller.popNext();
      return (await Promise.all([first, rejected])).map(e => e?.id || null);
    })).toEqual(["pool-d", null]);
  });

  test(`lowering capacity preserves accepted opening results (${label})`, async ({ page }) => {
    await start(page, groupMarkup("2"), { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const group = document.getElementById("pool"), controller = $ae(group).present;
      const jobs = [controller.popNext(), controller.popNext()];
      group.setAttribute("data-ae-present-group", "1");
      const opened = (await Promise.all(jobs)).map(e => e?.id || null);
      const next = await controller.popNext();
      return { opened, next: next.id, visible: Array.from(group.children).filter(e => !e.hidden).length };
    })).toEqual({ opened: ["pool-d", "pool-c"], next: "pool-d", visible: 2 });
  });

  test(`reusing the oldest member restarts only its auto-unpop (${label})`, async ({ page }) => {
    await start(page, groupMarkup("2"), { mode, forceLegacy });
    await page.clock.install();
    await page.evaluate(() => {
      window.zeroCounts = { "pool-c": 0, "pool-d": 0 };
      for (const member of document.querySelectorAll("#pool > article")) {
        member.setAttribute("data-ae-auto-unpop", "3000");
        member.addEventListener("AelluxJsProgress", e => {
          if (e.detail.value === 0 && member.id in window.zeroCounts) window.zeroCounts[member.id]++;
        });
      }
      window.first = $ae("pool").present.popNext();
    });
    await page.clock.runFor(50); await page.evaluate(() => window.first);
    await page.clock.runFor(1000);
    await page.evaluate(() => { window.second = $ae("pool").present.popNext(); });
    await page.clock.runFor(50); await page.evaluate(() => window.second);
    await page.clock.runFor(1000);
    await page.evaluate(() => { window.reused = $ae("pool").present.popNext(); });
    await page.clock.runFor(50); await page.evaluate(() => window.reused);
    await page.clock.runFor(2100);
    expect(await page.evaluate(() => ({ zeros: window.zeroCounts,
      oldestVisible: !document.getElementById("pool-d").hidden,
      otherClosed: document.getElementById("pool-c").hidden })))
      .toEqual({ zeros: { "pool-c": 2, "pool-d": 4 }, oldestVisible: true, otherClosed: true });
  });

  test(`closed members take priority over an outgoing member (${label})`, async ({ page }) => {
    await start(page, groupMarkup("2") + '<div id="single" data-ae-present-group><article id="only" data-ae-present hidden>Only</article></div>', { mode, forceLegacy });
    expect(await page.evaluate(async () => {
      const group = document.getElementById("pool"), pool = $ae(group).present;
      await pool.popNext(); const member = await pool.popNext();
      const closing = $ae(member).present.unpop();
      group.appendChild(member);
      const next = pool.popNext();
      const chosen = await next; await closing;
      const single = $ae("single").present;
      await single.popNext(); const only = document.getElementById("only");
      const outgoing = $ae(only).present.unpop();
      const reused = await single.popNext(); await outgoing;
      return { chosen: chosen.id, dismissedClosed: member.hidden, reused: reused.id, onlyVisible: !only.hidden };
    })).toEqual({ chosen: "pool-b", dismissedClosed: true, reused: "only", onlyVisible: true });
  });
}
