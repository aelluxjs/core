import { expect, test } from "@playwright/test";

test("iframe ajaxReplace traverses before parent state and restores only its own window", async ({ page }) => {
  await page.goto("/tests/browser/state-navigation-iframe-parent.html");
  const child = page.frameLocator("#child");
  await page.evaluate(() => window.fixtureReady);
  await child.locator("#child-ajax-replace").evaluate(() => window.fixtureReady);

  await page.locator("#parent-push").click();
  await child.locator("#child-ajax-replace").click();

  expect(await page.evaluate(() => history.state.snapshot)).toEqual({ page: "parent-entry" });
  expect(await child.locator("html").evaluate(() => history.state.ajaxReplace)).toEqual({
    url: "./state-navigation-iframe-child.html?ajax=next",
    selectors: ["#content"]
  });

  await page.locator("#back").click();
  await expect.poll(() => child.locator("html").evaluate(() => window.fixtureEvents.length)).toBe(2);
  expect(await page.evaluate(() => window.fixtureEvents)).toEqual([]);
  expect(await child.locator("html").evaluate(() => ({
    path: location.pathname,
    search: location.search,
    events: window.fixtureEvents,
    snapshot: AelluxJs.ext.stateNavigation.globalSnapshot
  }))).toMatchObject({
    path: "/tests/browser/state-navigation-iframe-child.html",
    search: "",
    events: [
      { type: "popstate", state: { aelluxJsState: true, ajaxReplace: { selectors: ["#content"] } } },
      { type: "SnapshotRestore", state: { aelluxJsState: true, ajaxReplace: { selectors: ["#content"] } } }
    ],
    snapshot: {}
  });

  await page.locator("#back").click();
  await expect.poll(() => page.evaluate(() => window.fixtureEvents.length)).toBe(2);
  expect(await page.evaluate(() => ({
    events: window.fixtureEvents,
    snapshot: AelluxJs.ext.stateNavigation.globalSnapshot
  }))).toMatchObject({
    events: [
      { type: "popstate", state: { aelluxJsState: true, snapshot: {} } },
      { type: "SnapshotRestore", state: { aelluxJsState: true, snapshot: {} } }
    ],
    snapshot: {}
  });
  expect(await child.locator("html").evaluate(() => window.fixtureEvents.length)).toBe(2);
});
