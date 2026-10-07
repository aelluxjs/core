import { expect, test } from "@playwright/test";

test("adaptive updates shape and size classes as its dimensions change", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div id="adaptive" data-ae-adaptive class="ae--fits-xl"
        style="width: 800px; height: 400px"></div>
    `;
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full" }));
  const element = page.locator("#adaptive");
  await expect(element).toHaveClass(/ae--shape-horizontal/);
  await expect(element).toHaveClass(/ae--fits-small/);
  await expect(element).not.toHaveClass(/ae--fits-medium/);
  await expect(element).not.toHaveClass(/ae--fits-xl/);

  await page.evaluate(() => {
    const element = document.querySelector("#adaptive");
    element.style.width = "200px";
    element.style.height = "500px";
  });
  await expect(element).toHaveClass(/ae--shape-vertical/);
  await expect(element).not.toHaveClass(/ae--shape-horizontal/);
  await expect(element).not.toHaveClass(/ae--fits-small/);

  await page.evaluate(() => AelluxJs.unmount(document.querySelector("#adaptive")));
  await expect(element).toHaveClass(/ae--fits-xl/);
  await expect(element).not.toHaveClass(/ae--shape-vertical/);
  await expect(element).not.toHaveClass(/ae--fits-small/);

  await page.evaluate(() => AelluxJs.update(document.querySelector("#adaptive")));
  await expect(element).toHaveClass(/ae--shape-vertical/);
  await expect(element).not.toHaveClass(/ae--fits-xl/);
});

test("adaptive uses window resize when ResizeObserver is unavailable", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    Object.defineProperty(window, "ResizeObserver", { configurable: true, value: undefined });
    document.body.innerHTML = '<div id="adaptive" data-ae-adaptive style="width: 800px; height: 400px"></div>';
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "full", forceLegacy: true }));
  const element = page.locator("#adaptive");
  await expect(element).toHaveClass(/ae--shape-horizontal/);

  await page.evaluate(() => {
    const element = document.querySelector("#adaptive");
    element.style.width = "400px";
    element.style.height = "400px";
    window.dispatchEvent(new Event("resize"));
  });
  await expect(element).toHaveClass(/ae--shape-square/);
  await expect(element).not.toHaveClass(/ae--shape-horizontal/);
});

test("adaptive merges extension options with its default parameters", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.evaluate(() => {
    document.body.innerHTML = '<div id="adaptive" data-ae-adaptive style="width: 800px; height: 400px"></div>';
  });
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => AelluxJs.init({
    mode: "full",
    extensions: {
      adaptive: {
        adaptiveParams: {
          experienceScale: { near: 1.2 },
          minSizes: { small: 600, tiny: 300 },
          ratioShapes: { horizontal: 2 }
        }
      }
    }
  }));
  const element = page.locator("#adaptive");
  await expect(element).toHaveClass(/ae--shape-square/);
  await expect(element).toHaveClass(/ae--fits-tiny/);
  await expect(element).not.toHaveClass(/ae--fits-small/);
  const params = await page.evaluate(() => AelluxJs.ext.adaptive.adaptiveParams);
  expect(params).toEqual({
    experienceScale: { near: 1.2, far: 1.5 },
    minSizes: { compact: 0, small: 600, medium: 768, large: 1024, xl: 1280, xxl: 1600, tiny: 300 },
    ratioShapes: { vertical: 0.8, horizontal: 2 }
  });
  await page.evaluate(() => AelluxJs.unmount(document.querySelector("#adaptive")));
  await expect(element).not.toHaveClass(/ae--fits-tiny/);
});
