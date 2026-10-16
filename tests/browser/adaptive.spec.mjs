import { expect, test } from "@playwright/test";

test("adaptive restores prior inline dimension variables on unmount", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(() => {
    document.body.innerHTML = `
      <div id="custom" data-ae-adaptive
        style="width: 120px; height: 80px; --ae-width: 42 !important; --ae-height: 24px"></div>
      <div id="unset" data-ae-adaptive style="width: 120px; height: 80px"></div>`;
    AelluxJs.ext("adaptive");
  });
  await page.addScriptTag({ url: "/src/aellux.ext.adaptive.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.adaptive?.initialized)).toBe(true);

  const values = () => page.evaluate(() => ["custom", "unset"].map(id => {
    const style = document.getElementById(id).style;
    return ["--ae-width", "--ae-height"].map(name => ({
      value: style.getPropertyValue(name),
      priority: style.getPropertyPriority(name)
    }));
  }));
  await expect.poll(values).toEqual([
    [{ value: "120", priority: "" }, { value: "80", priority: "" }],
    [{ value: "120", priority: "" }, { value: "80", priority: "" }]
  ]);

  await page.evaluate(() => AelluxJs.unmount(document.body, "adaptive"));
  expect(await values()).toEqual([
    [{ value: "42", priority: "important" }, { value: "24px", priority: "" }],
    [{ value: "", priority: "" }, { value: "", priority: "" }]
  ]);
});

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
  await expect(element).toHaveAttribute("aria-orientation", "horizontal");
  await expect(element).toHaveClass(/ae--fits-small/);
  await expect(element).not.toHaveClass(/ae--fits-medium/);
  await expect(element).not.toHaveClass(/ae--fits-xl/);

  await page.evaluate(() => {
    const element = document.querySelector("#adaptive");
    window.adaptiveDetails = [];
    element.addEventListener("AelluxJsAdaptiveUpdate", event =>
      window.adaptiveDetails.push(event.detail));
    element.style.width = "200px";
    element.style.height = "500px";
  });
  await expect(element).toHaveClass(/ae--shape-vertical/);
  await expect.poll(() => page.evaluate(() => window.adaptiveDetails.at(-1)))
    .toEqual({ width: 200, height: 500, ratio: 0.4 });
  await expect(element).toHaveAttribute("aria-orientation", "vertical");
  await expect(element).not.toHaveClass(/ae--shape-horizontal/);
  await expect(element).not.toHaveClass(/ae--fits-small/);

  await page.evaluate(() => AelluxJs.unmount(document.querySelector("#adaptive")));
  await expect(element).not.toHaveClass(/ae--fits-xl/);
  await expect(element).not.toHaveClass(/ae--shape-vertical/);
  await expect(element).not.toHaveClass(/ae--fits-small/);
  await expect(element).not.toHaveAttribute("aria-orientation");
  await expect(element).toHaveCSS("width", "200px");
  await expect(element).toHaveCSS("height", "500px");

  await page.evaluate(() => AelluxJs.mount(document.querySelector("#adaptive")));
  await expect(element).toHaveClass(/ae--shape-vertical/);
  await expect(element).toHaveAttribute("aria-orientation", "vertical");
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
  await expect(element).toHaveAttribute("aria-orientation", "horizontal");
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
  const immutable = await page.evaluate(() => {
    const config = AelluxJs.ext.adaptive.adaptiveParams;
    try { config.minSizes.small = 100; } catch (_) { }
    try { config.minSizes.extra = 100; } catch (_) { }
    return {
      groupsFrozen: Object.isFrozen(config) && Object.values(config).every(Object.isFrozen),
      small: config.minSizes.small,
      hasExtra: Object.prototype.hasOwnProperty.call(config.minSizes, "extra")
    };
  });
  expect(immutable).toEqual({ groupsFrozen: true, small: 600, hasExtra: false });
  await page.evaluate(() => AelluxJs.unmount(document.querySelector("#adaptive")));
  await expect(element).not.toHaveClass(/ae--fits-tiny/);
});
