import { expect, test } from "@playwright/test";

test("ARIA handlers arbitrate each attribute and restore its original value", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => aelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => typeof aelluxJs.aria?.register)).toBe("function");

  const result = await page.evaluate(() => {
    const element = document.createElement("button");
    element.setAttribute("aria-label", "original");
    element.setAttribute("aria-controls", "original-panel");
    document.body.append(element);

    const low = aelluxJs.aria.register(element);
    const high = aelluxJs.aria.register(element, { priority: 10 });
    low.set({ label: "low", controls: ["one", "two"], hidden: true });
    high.set({ label: "high", controls: ["other"], hidden: false });
    const claimed = {
      label: element.getAttribute("aria-label"),
      controls: element.getAttribute("aria-controls"),
      hidden: element.getAttribute("aria-hidden"),
      initialControls: high.initial("controls")
    };

    low.set({ label: "low-updated" });
    const stillHigh = element.getAttribute("aria-label");
    high.release();
    const afterHigh = {
      label: element.getAttribute("aria-label"),
      controls: element.getAttribute("aria-controls"),
      hidden: element.getAttribute("aria-hidden")
    };
    low.unset("controls");
    const afterUnset = element.getAttribute("aria-controls");
    low.release();
    const restored = {
      label: element.getAttribute("aria-label"),
      controls: element.getAttribute("aria-controls"),
      hidden: element.getAttribute("aria-hidden")
    };

    const first = aelluxJs.aria.register(element);
    const second = aelluxJs.aria.register(element);
    first.set({ expanded: true });
    second.set({ expanded: false });
    first.set({ expanded: true });
    const tie = element.getAttribute("aria-expanded");
    second.release();
    const afterTieRelease = element.getAttribute("aria-expanded");
    first.release();
    const afterAllReleased = element.getAttribute("aria-expanded");
    element.remove();

    return { claimed, stillHigh, afterHigh, afterUnset, restored,
      tie, afterTieRelease, afterAllReleased };
  });

  expect(result).toEqual({
    claimed: { label: "high", controls: "other", hidden: "true", initialControls: "original-panel" },
    stillHigh: "high",
    afterHigh: { label: "low-updated", controls: "one two", hidden: "true" },
    afterUnset: "original-panel",
    restored: { label: "original", controls: "original-panel", hidden: null },
    tie: "false",
    afterTieRelease: "true",
    afterAllReleased: null
  });
});

test("Present ARIA claims yield to a higher priority handler and resume afterward", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `
      <button id="trigger" data-ae-present-trigger="toggle" data-ae-present-target="#panel"
        aria-controls="original"></button>
      <div id="panel" data-ae-present hidden></div>
    `;
    aelluxJs.init({ mode: "full" });
  });
  await expect(page.locator("#trigger")).toHaveAttribute("aria-controls", "panel original");

  const result = await page.evaluate(async () => {
    const trigger = document.getElementById("trigger");
    const higher = aelluxJs.aria.register(trigger, { priority: 10 });
    higher.set({ controls: ["other"], expanded: true });
    const overridden = {
      controls: trigger.getAttribute("aria-controls"),
      expanded: trigger.getAttribute("aria-expanded")
    };
    higher.release();
    const resumed = {
      controls: trigger.getAttribute("aria-controls"),
      expanded: trigger.getAttribute("aria-expanded")
    };
    await aelluxJs.unmount(trigger, "present");
    return {
      overridden, resumed,
      restored: {
        controls: trigger.getAttribute("aria-controls"),
        expanded: trigger.getAttribute("aria-expanded")
      }
    };
  });

  expect(result).toEqual({
    overridden: { controls: "other", expanded: "true" },
    resumed: { controls: "panel original", expanded: "false" },
    restored: { controls: "original", expanded: null }
  });
});
