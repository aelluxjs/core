import { expect, test } from "@playwright/test";

test("focus hint, history restoration and navigation back", async ({ page }) => {
  await page.goto("/tests/browser/focus.html");
  await page.evaluate(() => window.fixtureReady);
  expect(await page.locator("#first").getAttribute("enterkeyhint")).toBe("next");
  expect(await page.locator("#second").getAttribute("enterkeyhint")).toBe("done");

  await page.evaluate(() => AelluxJs.unmount(document.querySelector("#first")));
  expect(await page.locator("#first").getAttribute("enterkeyhint")).toBeNull();
  await page.evaluate(() => AelluxJs.unmount(document.querySelector("#second")));
  expect(await page.locator("#second").getAttribute("enterkeyhint")).toBe("done");
  await page.evaluate(async () => {
    await AelluxJs.mount(document.querySelector("#first"));
    await AelluxJs.mount(document.querySelector("#second"));
  });

  const pushedStates = [];
  await page.exposeFunction("recordFocusPushState", detail => pushedStates.push(detail));
  await page.evaluate(() => document.addEventListener("AelluxJsPushState", event => {
    window.recordFocusPushState(event.detail);
  }));

  await page.locator("#first").focus();
  await expect.poll(() => pushedStates.length).toBeGreaterThan(0);
  expect(pushedStates.at(-1)).toEqual({ key: "ae-focus", value: "first" });
  const firstHistoryLength = await page.evaluate(() => history.length);
  await page.evaluate(() => {
    document.getElementById("first").dispatchEvent(new Event("blur", { bubbles: false }));
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new Event("focus"));
  });
  expect(await page.evaluate(() => history.length)).toBe(firstHistoryLength);
  await page.locator("#second").focus();
  await page.locator("#third").focus();
  expect(await page.evaluate(() => history.length)).toBeGreaterThan(1);
  await page.evaluate(() => history.back());
  await expect(page.locator("#second")).toBeFocused();

  await page.locator("#second").evaluate(element => element.hidden = true);
  expect(await page.evaluate(() => AelluxJs.ext.focus.restoreLastFocus())).toBe(true);
  await expect(page.locator("#first")).toBeFocused();
});

test("focus hashes element IDs and keeps ID-less targets in local history only", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `<input id="first"><input><input id="second">`;
    AelluxJs.ext("state-navigation");
    AelluxJs.ext("focus");
    window.focusPushes = [];
    document.addEventListener("AelluxJsPushState", event => window.focusPushes.push(event.detail));
  });
  await page.addScriptTag({ url: "/src/aellux.ext.state-navigation.js" });
  await page.addScriptTag({ url: "/src/aellux.ext.focus.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.focus?.initialized)).toBe(true);
  await page.evaluate(() => AelluxJs.wait("state-navigation"));

  await page.locator("#first").focus();
  expect(await page.evaluate(() => ({ hash: location.hash, pushes: window.focusPushes })))
    .toEqual({ hash: "#ae-focus=first", pushes: [{ key: "ae-focus", value: "first" }] });
  const historyLength = await page.evaluate(() => history.length);
  await page.locator("input:not([id])").focus();
  expect(await page.evaluate(() => ({ hash: location.hash, pushes: window.focusPushes,
    historyLength: history.length }))).toEqual({
    hash: "#ae-focus=first", pushes: [{ key: "ae-focus", value: "first" }], historyLength
  });
  expect(await page.evaluate(() => AelluxJs.ext.focus.restoreLastFocus())).toBe(true);
  await expect(page.locator("#first")).toBeFocused();

  await page.evaluate(() => AelluxJs.dispatch("SnapshotRestore", {
    detail: { snapshot: { "ae-focus": "second" } }
  }));
  await expect(page.locator("#second")).toBeFocused();
});

test("Enter advances focus and respects unmount and unavailable controls", async ({ page }) => {
  await page.goto("/tests/browser/focus.html");
  await page.evaluate(() => window.fixtureReady);

  await page.locator("#first").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#second")).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.locator("#third")).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(page.locator("#last")).toBeFocused();

  await page.locator("#editable span").click();
  await page.keyboard.press("Enter");
  await expect(page.locator("#after-editable")).toBeFocused();

  await page.evaluate(() => AelluxJs.unmount(document.querySelector("#first")));
  await page.locator("#first").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#first")).toBeFocused();
});
