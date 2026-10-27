import { expect, test } from "@playwright/test";

async function startFeedback(page, markup, { mode = "full", forceLegacy = false, boot = "aellux.js", withPresent = true } = {}) {
  await page.goto("/tests/index.htm");
  await page.evaluate(markup => { document.body.innerHTML = markup; }, markup);
  await page.addScriptTag({ url: `/dist/${boot}` });
  await page.evaluate(async ({ mode, forceLegacy, withPresent }) => {
    if (mode === "basic") {
      AelluxJs.ext("feedback", { loadStyle: true });
      if (withPresent) AelluxJs.ext("present", { loadStyle: true });
    }
    await new Promise(resolve => {
      AelluxJs.on("Ready", resolve, { once: true });
      AelluxJs.init({ mode, forceLegacy, skipGlobalMount: true, environment: "development" });
    });
    await AelluxJs.mount(document);
  }, { mode, forceLegacy, withPresent });
}

test("feedback boundaries update text, filter types, and load standard motion styles", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    const section = document.createElement("section");
    section.setAttribute("data-ae-feedback", "error");
    section.setAttribute("data-ae-message-target", "feedback-message");
    section.setAttribute("data-ae-transform-target", "feedback-field");
    section.innerHTML = '<input id="feedback-field"><p id="feedback-message"><strong>Label</strong></p>';
    document.body.appendChild(section);
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.feedback?.initialized)).toBe(true);

  const result = await page.evaluate(() => {
    const section = document.querySelector("[data-ae-feedback]");
    const field = document.getElementById("feedback-field");
    const message = document.getElementById("feedback-message");
    const received = [];
    document.addEventListener("AelluxJsFeedback", event => received.push(event.detail.type));
    AelluxJs.ext.feedback.warning("Ignored here", field);
    AelluxJs.ext.feedback.error("Check email", field, null, "shake");
    return {
      received,
      message: message.textContent,
      labelPreserved: message.querySelector("strong")?.textContent,
      boundaryClass: section.classList.contains("ae--feedback-error"),
      messageClass: message.classList.contains("ae--feedback-error"),
      motionClass: field.classList.contains("ae--feedback-motion-shake"),
      styleLoaded: Boolean(document.querySelector('link[data-ae-full-style]'))
    };
  });
  expect(result).toEqual({
    received: ["warning"],
    message: "LabelCheck email",
    labelPreserved: "Label",
    boundaryClass: true,
    messageClass: true,
    motionClass: true,
    styleLoaded: true
  });
});

test("feedback rejects invalid arguments before dispatch", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.orchestratorVersion)).toBe("0.1.0-beta.10");
  await page.evaluate(() => AelluxJs.wait("feedback"));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.feedback?.initialized)).toBe(true);

  const result = await page.evaluate(() => {
    let events = 0;
    document.addEventListener("AelluxJsFeedback", () => events++);
    const feedback = AelluxJs.ext.feedback;
    feedback.warning(42);
    feedback.send({ type: "custom", message: "bad type" });
    feedback.error("bad target", document);
    feedback.error("bad motion", undefined, null, 1);
    return {
      events,
      arguments: AelluxJs.diagnostics.showHistory()
        .filter(entry => entry.code === 1122)
        .map(entry => entry.context.argument)
    };
  });
  expect(result).toEqual({ events: 0, arguments: ["message", "type", "target", "motion"] });
});

for (const options of [
  { mode: "full", forceLegacy: false, boot: "aellux.js" },
  { mode: "full", forceLegacy: true, boot: "aellux.min.js" },
  { mode: "basic", forceLegacy: false, boot: "aellux.js" },
  { mode: "basic", forceLegacy: true, boot: "aellux.min.js" }
]) {
  const label = `${options.mode}, legacy=${options.forceLegacy}`;
  test(`feedback controllers publish from their boundary and follow mount lifecycle (${label})`, async ({ page }) => {
    await startFeedback(page, '<p id="boundary" data-ae-feedback></p><p id="other" data-ae-feedback></p>', options);
    const result = await page.evaluate(async () => {
      const boundary = document.getElementById("boundary");
      const other = document.getElementById("other");
      const controller = AelluxJs.mountManager.controller(boundary);
      const feedback = controller.feedback;
      const types = ["warning", "error", "success", "announce", "busy", "validate", "progress"];
      const received = [];
      const subscription = AelluxJs.ext.feedback.on("*", detail => received.push({
        type: detail.type, message: detail.message, value: detail.value,
        target: detail.target.id, motion: detail.motion
      }));
      for (const type of types) feedback[type](`controller ${type}`, 0.5, "pulse");
      feedback.send({ type: "success", message: "sent", value: 1, target: other });
      const rendered = boundary.textContent;
      const otherText = other.textContent;
      await controller.unmount("feedback");
      const removed = !controller.feedback && Object.keys(feedback).length === 0;
      await controller.mount("feedback");
      AelluxJs.mountManager.controller(boundary).feedback.error("remounted");
      subscription.off();
      return { received, rendered, otherText, removed, remounted: boundary.textContent };
    });
    expect(result).toEqual({
      received: [
        ...["warning", "error", "success", "announce", "busy", "validate", "progress"].map(type => ({
          type, message: `controller ${type}`, value: 0.5, target: "boundary", motion: "pulse"
        })),
        { type: "success", message: "sent", value: 1, target: "boundary", motion: undefined },
        { type: "error", message: "remounted", value: undefined, target: "boundary", motion: undefined }
      ],
      rendered: "sent", otherText: "", removed: true, remounted: "remounted"
    });
  });

  test(`feedback pops only the explicit target once per accepted event (${label})`, async ({ page }) => {
    await startFeedback(page, `<section id="boundary" data-ae-feedback="error"
      data-ae-message-target="#message" data-ae-transform-target="message" data-ae-present-target="#panel"></section>
      <aside id="ancestor" data-ae-present hidden><p id="message"><strong>Label:</strong></p></aside>
      <aside id="panel" data-ae-present hidden>Panel</aside>`, options);
    const result = await page.evaluate(async () => {
      const boundary = document.getElementById("boundary");
      const panel = document.getElementById("panel");
      const message = document.getElementById("message");
      const feedback = AelluxJs.ext.feedback;
      const calls = [];
      const beforePop = [];
      const pop = AelluxJs.ext.present.pop;
      AelluxJs.ext.present.pop = element => { calls.push(element.id); return pop(element); };
      panel.addEventListener(AelluxJs.eventName("BeforePop"), () => beforePop.push({
        text: message.textContent, typeClass: message.classList.contains("ae--feedback-error")
      }));
      feedback.warning("ignored", boundary, null, "shake");
      const ignored = calls.length === 0 && message.textContent === "Label:";
      const firstPop = new Promise(resolve => panel.addEventListener(AelluxJs.eventName("Pop"), resolve, { once: true }));
      feedback.error("first", boundary, null, "shake");
      const motion = message.classList.contains("ae--feedback-motion-shake");
      await firstPop;
      const firstVisible = !panel.hidden;
      const secondPop = new Promise(resolve => panel.addEventListener(AelluxJs.eventName("Pop"), resolve, { once: true }));
      feedback.error("second", boundary);
      await secondPop;
      return { ignored, calls, beforePop, motion, firstVisible, visible: !panel.hidden,
        ancestorHidden: document.getElementById("ancestor").hidden,
        unknownAttributes: AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 2024).length };
    });
    expect(result).toEqual({ ignored: true, calls: ["panel", "panel"],
      beforePop: [{ text: "Label:first", typeClass: true }, { text: "Label:second", typeClass: true }],
      motion: true, firstVisible: true, visible: true, ancestorHidden: true, unknownAttributes: 0 });
  });

  test(`feedback respects Present veto, retargeting and missing IDs (${label})`, async ({ page }) => {
    await startFeedback(page, `<section id="boundary" data-ae-feedback data-ae-message-target="message"
      data-ae-transform-target="motion" data-ae-present-target="panel"></section>
      <p id="message"></p><span id="motion"></span>
      <aside id="panel" data-ae-present hidden>Panel</aside>
      <aside id="other" data-ae-present hidden>Other</aside>`, options);
    const result = await page.evaluate(async () => {
      const boundary = document.getElementById("boundary");
      const panel = document.getElementById("panel");
      const other = document.getElementById("other");
      panel.addEventListener(AelluxJs.eventName("BeforePop"), event => event.preventDefault());
      AelluxJs.ext.feedback.error("vetoed", boundary);
      const vetoed = panel.hidden;
      boundary.setAttribute("data-ae-present-target", "#other");
      const opened = new Promise(resolve => other.addEventListener(AelluxJs.eventName("Pop"), resolve, { once: true }));
      AelluxJs.ext.feedback.success("retargeted", boundary);
      await opened;
      boundary.setAttribute("data-ae-present-target", "absent-panel");
      AelluxJs.ext.feedback.error("still updates", boundary, null, "shake");
      return { vetoed, otherVisible: !other.hidden, panelHidden: panel.hidden,
        message: document.getElementById("message").textContent,
        motion: document.getElementById("motion").classList.contains("ae--feedback-motion-shake"),
        missing: AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 2011)
          .map(entry => entry.context.elementOrId) };
    });
    expect(result).toEqual({ vetoed: true, otherVisible: true, panelHidden: true,
      message: "still updates", motion: true, missing: ["absent-panel"] });
  });

  test(`feedback leaves ancestor Present unchanged without a present target (${label})`, async ({ page }) => {
    await startFeedback(page, '<aside id="panel" data-ae-present hidden><p id="boundary" data-ae-feedback></p></aside>', options);
    const result = await page.evaluate(() => {
      let calls = 0;
      const pop = AelluxJs.ext.present.pop;
      AelluxJs.ext.present.pop = element => { calls++; return pop(element); };
      const boundary = document.getElementById("boundary");
      AelluxJs.ext.feedback.announce("default targets", boundary);
      return { calls, hidden: document.getElementById("panel").hidden, message: boundary.textContent };
    });
    expect(result).toEqual({ calls: 0, hidden: true, message: "default targets" });
  });

  test(`empty present target prefers the message container and falls back to the transform container (${label})`, async ({ page }) => {
    await startFeedback(page, `<section id="boundary" data-ae-feedback data-ae-message-target="message"
      data-ae-transform-target="motion" data-ae-present-target=""></section>
      <aside id="outer" data-ae-present hidden>
        <aside id="message-panel" data-ae-present hidden><p id="message"></p></aside>
        <aside id="motion-panel" data-ae-present hidden><span id="motion"></span></aside>
      </aside><p id="outside"></p>`, options);
    const result = await page.evaluate(async () => {
      const boundary = document.getElementById("boundary");
      const panels = ["message-panel", "motion-panel"].map(id => document.getElementById(id));
      const calls = [];
      const pop = AelluxJs.ext.present.pop;
      AelluxJs.ext.present.pop = element => { calls.push(element.id); return pop(element); };
      function opened(panel) {
        return new Promise(resolve => panel.addEventListener(AelluxJs.eventName("Pop"), resolve, { once: true }));
      }
      const separate = opened(panels[0]);
      $ae(boundary).feedback.error("separate");
      await separate;
      const first = panels.map(panel => !panel.hidden);
      boundary.setAttribute("data-ae-present-target", "   ");
      boundary.setAttribute("data-ae-transform-target", "#message");
      const shared = opened(panels[0]);
      AelluxJs.ext.feedback.error("shared", boundary, null, "shake");
      await shared;
      boundary.setAttribute("data-ae-transform-target", "motion");
      boundary.setAttribute("data-ae-message-target", "outside");
      const fallback = opened(panels[1]);
      $ae(boundary).feedback.error("fallback");
      await fallback;
      boundary.setAttribute("data-ae-message-target", "missing-message");
      const missing = opened(panels[1]);
      $ae(boundary).feedback.error("missing");
      await missing;
      return { calls, first, outerHidden: document.getElementById("outer").hidden,
        message: document.getElementById("message").textContent,
        invalidIDs: AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 2011).length };
    });
    expect(result).toEqual({ calls: ["message-panel", "message-panel", "motion-panel", "motion-panel"], first: [true, false],
      outerHidden: true, message: "shared", invalidIDs: 1 });
  });

  test(`empty present target supports the boundary itself and ignores unmounted containers (${label})`, async ({ page }) => {
    await startFeedback(page, '<aside id="boundary" data-ae-present data-ae-feedback data-ae-present-target hidden></aside>', options);
    const result = await page.evaluate(async () => {
      const boundary = document.getElementById("boundary");
      let requests = 0;
      boundary.addEventListener(AelluxJs.eventName("BeforePop"), () => requests++);
      const opened = new Promise(resolve => boundary.addEventListener(AelluxJs.eventName("Pop"), resolve, { once: true }));
      AelluxJs.ext.feedback.success("self", boundary);
      await opened;
      const selfVisible = !boundary.hidden;
      // These new Present containers have not been mounted.
      boundary.insertAdjacentHTML("afterend", '<aside id="unmounted" data-ae-present hidden><p id="message"></p></aside><span id="outside"></span>');
      boundary.setAttribute("data-ae-message-target", "message");
      boundary.setAttribute("data-ae-transform-target", "outside");
      AelluxJs.ext.feedback.success("unmounted", boundary);
      const unmountedHidden = document.getElementById("unmounted").hidden;
      const rendered = document.getElementById("message").textContent;
      boundary.setAttribute("data-ae-message-target", "missing-message");
      boundary.setAttribute("data-ae-transform-target", "missing-motion");
      AelluxJs.ext.feedback.success("missing", boundary);
      return { requests, selfVisible, unmountedHidden, rendered,
        missing: AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 2011)
          .map(entry => entry.context.elementOrId),
        controllerErrors: AelluxJs.diagnostics.showHistory().filter(entry => entry.code === 1004).length };
    });
    expect(result).toEqual({ requests: 1, selfVisible: true, unmountedHidden: true, rendered: "unmounted",
      missing: ["missing-message", "missing-motion"], controllerErrors: 0 });
  });
}

test("feedback continues rendering when Present is not registered", async ({ page }) => {
  await startFeedback(page, `<section id="boundary" data-ae-feedback data-ae-message-target="message"
    data-ae-transform-target="motion" data-ae-present-target="panel"></section>
    <p id="message"></p><span id="motion"></span><aside id="panel" data-ae-present hidden>Panel</aside>`,
  { mode: "basic", withPresent: false });
  const result = await page.evaluate(() => {
    AelluxJs.ext.feedback.error("rendered", document.getElementById("boundary"), null, "shake");
    return { absent: !AelluxJs.ext.present, hidden: document.getElementById("panel").hidden,
      message: document.getElementById("message").textContent,
      motion: document.getElementById("motion").classList.contains("ae--feedback-motion-shake") };
  });
  expect(result).toEqual({ absent: true, hidden: true, message: "rendered", motion: true });
});
