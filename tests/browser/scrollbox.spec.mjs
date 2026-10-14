import { expect, test } from "@playwright/test";

test("scrollbox exposes progress in both axes and restores styles on unmount", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div id="scrollbox" data-ae-scrollbox="native"
        style="width: 100px; height: 100px; overflow: auto;
          --ae-scroll-x-progress: .4; --ae-scroll-y-progress: .7">
        <div style="width: 300px; height: 400px"></div>
      </div>`;
    AelluxJs.ext("scrollbox");
  });
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);

  const progress = () => page.evaluate(() => {
    const element = document.getElementById("scrollbox");
    return ["--ae-scroll-y-progress", "--ae-scroll-x-progress"]
      .map(name => Number(element.style.getPropertyValue(name)));
  });
  await expect.poll(progress).toEqual([0, 0]);

  await page.evaluate(() => document.getElementById("scrollbox").scrollTo(100, 150));
  await expect.poll(progress).toEqual([0.5, 0.5]);

  await page.evaluate(() => document.getElementById("scrollbox").scrollTo(999, 999));
  await expect.poll(progress).toEqual([1, 1]);

  await page.evaluate(() => AelluxJs.unmount(document.getElementById("scrollbox"), "scrollbox"));
  expect(await progress()).toEqual([0.7, 0.4]);
});
