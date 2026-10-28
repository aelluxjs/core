import { expect, test } from "@playwright/test";

for (const [name, property, expected, contents] of [
  ["scrollbox", "overflow", "auto", '<div style="width:300px;height:300px"></div>'],
  ["anchor", "position", "absolute", "Anchor"],
  ["overflow-marquee", "white-space", "nowrap", "A long label for the generated wrapper"]
]) {
  test(`${name} uses the external stylesheet through mount, unmount and destruction`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: "/dist/aellux.js" });
    await page.evaluate(({ name, contents }) => {
      document.body.innerHTML = `<div style="position:relative;width:300px;height:200px">
        <div id="subject" data-ae-${name} style="width:100px;height:50px">${contents}</div></div>`;
      AelluxJs.ext(name, { loadStyle: true });
      AelluxJs.init({ mode: "basic" });
    }, { name, contents });

    const style = page.locator(`link[data-ae-ext-style="${name}"]`);
    await expect(style).toHaveCount(1);
    await expect(page.locator("#subject")).toHaveCSS(property, expected);
    await expect(page.locator(`style[data-ae-${name}-style]`)).toHaveCount(0);
    expect(await page.locator("style[data-ae-weak-style]").textContent())
      .not.toMatch(/scrollbox|scrollbar|snap-item|anchored|anchor|overflow-marquee|pointerscrolling/);

    await page.evaluate(name => AelluxJs.unmount(document.getElementById("subject"), name), name);
    await expect(style).toHaveCount(1);
    await page.evaluate(name => AelluxJs.mount(document.getElementById("subject"), name), name);
    await expect(style).toHaveCount(1);
    await expect(page.locator("#subject")).toHaveCSS(property, expected);

    await page.evaluate(() => AelluxJs.destroy());
    await expect(style).toHaveCount(0);
  });

  test(`${name} initializes without requesting or injecting styles when loadStyle is omitted`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: "/dist/aellux.js" });
    await page.evaluate(name => {
      AelluxJs.ext(name);
      AelluxJs.init({ mode: "basic" });
    }, name);
    await expect.poll(() => page.evaluate(name => {
      const key = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      return AelluxJs.ext[key]?.initialized;
    }, name)).toBe(true);
    await expect(page.locator("link[rel=stylesheet]")).toHaveCount(0);
    await expect(page.locator("style:not([data-ae-weak-style])")).toHaveCount(0);
  });
}
