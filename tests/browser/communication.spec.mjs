import { expect, test } from "@playwright/test";

async function start(page, forceLegacy, markup, extensions) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(({ forceLegacy, markup, extensions }) => {
    document.body.innerHTML = markup;
    window.bootCommunication = AelluxJs.comm;
    for (const name of extensions) AelluxJs.ext(name, { loadStyle: true });
    return new Promise(resolve => {
      AelluxJs.on("Ready", resolve, { once: true });
      AelluxJs.init({ mode: "basic", forceLegacy });
    });
  }, { forceLegacy, markup, extensions });
}

for (const legacy of [false, true]) test.describe(`Communication (Legacy=${legacy})`, () => {
  test("boot helper survives runtime startup and owned providers are released on failure, destruction and abort", async ({ page }) => {
    await start(page, legacy, "<button>Test</button>", []);
    const result = await page.evaluate(async () => {
      const comm = AelluxJs.comm;
      const same = comm === window.bootCommunication;
      const missing = comm.request("missing").handled;
      AelluxJs.ext("comm-owner");
      let fail = true, notifications = 0;
      AelluxJs.extAttach("comm-owner", {
        init() {
          comm.handle("owned", () => null, { owner: "comm-owner" });
          comm.on("change", () => notifications++, { owner: "comm-owner" });
          if (fail) throw new Error("expected initialization failure");
        }, destroy() {}
      });
      await AelluxJs.wait("comm-owner");
      const failedReleased = !comm.has("owned");
      comm.emit("change"); fail = false;
      await AelluxJs.wait("comm-owner");
      const empty = comm.request("owned"); comm.emit("change");
      await AelluxJs.destroyExtensions("comm-owner"); comm.emit("change");
      const abort = new AbortController();
      comm.handle("abortable", () => false, { signal: abort.signal }); abort.abort();
      return { same, missing, failedReleased, empty, notifications, destroyedReleased: !comm.has("owned"), aborted: !comm.has("abortable") };
    });
    expect(result).toEqual({ same: true, missing: false, failedReleased: true, empty: { handled: true, value: null },
      notifications: 1, destroyedReleased: true, aborted: true });
  });

  test("Focus and Feedback invoke Present contracts without accessing its public methods", async ({ page }) => {
    await start(page, legacy, `<section data-ae-focus-scope>
      <button id="open" data-ae-shortcut="keyboard:KeyI" data-ae-shortcut-action="pop" data-ae-shortcut-target="panel">Open</button>
      <div id="panel" data-ae-present hidden>Panel</div></section>
      <div id="feedback" data-ae-feedback data-ae-present-target="messages"></div>
      <section id="messages" data-ae-present-group="2"><div id="message1" data-ae-present hidden></div><div id="message2" data-ae-present hidden></div></section>`,
    ["input", "focus", "feedback", "present"]);
    await page.evaluate(() => {
      for (const name of ["pop", "unpop", "dismiss", "selected", "popNext"]) AelluxJs.ext.present[name] = () => { throw new Error("Direct Present API consumption"); };
      window.prepared = [];
      AelluxJs.on("BeforePop", event => { if (event.target.closest("#messages")) window.prepared.push(event.target.textContent); });
    });
    await page.locator("#open").focus(); await page.keyboard.press("i");
    await expect(page.locator("#panel")).toBeVisible();
    await page.evaluate(() => {
      const element = document.getElementById("feedback");
      AelluxJs.ext.feedback.success("First", element); AelluxJs.ext.feedback.error("Second", element);
    });
    await expect.poll(() => page.evaluate(() => window.prepared)).toEqual(["First", "Second"]);
    expect(await page.locator('#messages > :not([hidden])').count()).toBe(2);
  });

  test("Snap requests work after reload and cannot leave a retained Scrollbox controller", async ({ page }) => {
    await start(page, legacy, `<div id="box" data-ae-scrollbox data-ae-scrollbox-snap style="width:100px;height:60px;overflow:auto">
      <div style="display:flex;width:300px"><div data-ae-snap-item="start" style="width:100px;flex:none">One</div><div data-ae-snap-item="start" style="width:100px;flex:none">Two</div></div></div>`, ["scrollbox"]);
    const result = await page.evaluate(async () => {
      const box = document.getElementById("box");
      AelluxJs.ext.scrollbox.registerSnapController = AelluxJs.ext.scrollbox.unregisterSnapController = () => { throw new Error("Direct controller consumption"); };
      AelluxJs.ext("scrollbox-snap"); await AelluxJs.wait("scrollbox-snap"); await AelluxJs.mount(box);
      const before = AelluxJs.ext.scrollbox.goto(box, 1, "instant");
      await AelluxJs.destroyExtensions("scrollbox-snap");
      const absent = AelluxJs.ext.scrollbox.next(box);
      AelluxJs.ext("scrollbox-snap"); await AelluxJs.wait("scrollbox-snap"); await AelluxJs.mount(box);
      return { before, absent, reloaded: AelluxJs.ext.scrollbox.goto(box, 1, "instant") };
    });
    expect(result).toEqual({ before: true, absent: false, reloaded: true });
  });

  test("Marquee requests geometry without receiving Anchor's placement API", async ({ page }) => {
    await start(page, legacy, `<div id="marquee" data-ae-overflow-marquee style="width:120px;white-space:nowrap;overflow:hidden">A deliberately long line to move across the viewport</div>`, ["anchor"]);
    await page.evaluate(async () => {
      AelluxJs.ext.anchor.createPlacementMap = () => { throw new Error("Direct Anchor API consumption"); };
      AelluxJs.ext("overflow-marquee", { loadStyle: true }); await AelluxJs.wait("overflow-marquee"); await AelluxJs.mount(document);
    });
    await expect(page.locator("#marquee")).toHaveAttribute("data-ae-overflow-marquee-ready", "");
    await page.evaluate(() => AelluxJs.destroyExtensions("overflow-marquee"));
    expect(await page.locator("[data-ae-overflow-marquee-content]").count()).toBe(0);
  });
});
