import { expect, test } from "@playwright/test";

test("focus hint, history restoration and navigation back", async ({ page }) => {
  await page.goto("/tests/browser/focus.html");
  await page.evaluate(() => window.fixtureReady);
  expect(await page.locator("#first").getAttribute("enterkeyhint")).toBe("next");
  expect(await page.locator("#second").getAttribute("enterkeyhint")).toBe("done");

  await page.locator("#first").focus();
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
