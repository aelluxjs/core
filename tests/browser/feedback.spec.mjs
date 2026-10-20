import { expect, test } from "@playwright/test";

test("feedback boundaries update text, filter types, and load standard motion styles", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    const section = document.createElement("section");
    section.setAttribute("data-ae-feedback", "error");
    section.setAttribute("data-ae-target-message", "feedback-message");
    section.setAttribute("data-ae-target-transform", "feedback-field");
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
      styleLoaded: Boolean(document.querySelector('link[data-ae-ext-style="feedback"]'))
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
