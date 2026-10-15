import { expect, test } from "@playwright/test";

async function setup(page, markup) {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  await page.evaluate(html => {
    document.body.innerHTML = html;
    AelluxJs.ext("scrollbox");
  }, markup);
  await page.addScriptTag({ url: "/src/aellux.ext.scrollbox.js" });
  await page.evaluate(() => AelluxJs.init({ mode: "basic" }));
  await expect.poll(() => page.evaluate(() => AelluxJs.ext.scrollbox?.initialized)).toBe(true);
}

test("custom scrollbar stays over the viewport and supports track click and thumb drag", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="vertical"
    style="width:120px;height:120px;overflow-y:auto;overflow-x:hidden">
    <div style="height:600px;width:100px"></div>
  </div>`);
  const box = page.locator("#box");
  const track = page.locator("#box > [data-ae-scrollbar-vertical]");
  await expect(track).toHaveCount(1);
  await expect(box).toHaveClass(/ae--native-sb-hide/);
  await page.evaluate(() => document.getElementById("box").scrollTop = 80);
  await expect.poll(async () => {
    const a = await box.boundingBox(), b = await track.boundingBox();
    return Math.round(b.y - a.y);
  }).toBe(0);
  const start = await track.boundingBox();
  await page.mouse.click(start.x + 4, start.y + 110);
  await expect.poll(() => box.evaluate(element => element.scrollTop)).toBeGreaterThan(80);
  await page.evaluate(() => document.getElementById("box").scrollTop = 0);
  const thumb = await track.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-size")));
  const rect = await track.boundingBox();
  await page.mouse.move(rect.x + 4, rect.y + thumb / 2);
  await page.mouse.down();
  await page.mouse.move(rect.x + 4, rect.y + 95, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => box.evaluate(element => element.scrollTop)).toBeGreaterThan(300);
  await expect(track).toHaveCSS("opacity", "1");
  await page.mouse.move(rect.x + 140, rect.y + 140);
  await expect(track).toHaveCSS("opacity", "0");
});

test("scrollbars are siblings of the snap and elastic wrapper and are removed on unmount", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="h v"
    style="width:120px;height:120px;overflow:auto">
    <div data-ae-scrollbox-elastic data-ae-scrollbox-snap style="display:flex;width:360px;height:360px">
      <div style="flex:none;width:120px;height:360px"></div>
      <div style="flex:none;width:120px;height:360px"></div>
      <div style="flex:none;width:120px;height:360px"></div>
    </div>
  </div>`);
  const result = await page.evaluate(async () => {
    const box = document.getElementById("box");
    const before = {
      children: box.children.length,
      vertical: box.querySelectorAll(":scope > [data-ae-scrollbar-vertical]").length,
      horizontal: box.querySelectorAll(":scope > [data-ae-scrollbar-horizontal]").length,
      errors: AelluxJs.diagnostics.showHistory().filter(item =>
        item.code === 1120 || item.code === 1121).length
    };
    await AelluxJs.mountManager.unmount(document.body, "scrollbox");
    return { before, after: box.children.length,
      hiddenClass: box.classList.contains("ae--native-sb-hide") };
  });
  expect(result).toEqual({ before: { children: 3, vertical: 1, horizontal: 1,
    errors: 0 }, after: 1, hiddenClass: false });
});

test("an existing scrollbar is reused and its inline values survive unmount", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="y"
    style="width:100px;height:100px;overflow-y:auto">
    <div style="height:400px"></div>
    <div id="existing" data-ae-scrollbar-vertical
      style="--ae-scrollbar-x:7px!important"></div>
  </div>`);
  const result = await page.evaluate(async () => {
    const box = document.getElementById("box");
    const existing = document.getElementById("existing");
    const count = box.querySelectorAll(":scope > [data-ae-scrollbar-vertical]").length;
    await AelluxJs.mountManager.unmount(document.body, "scrollbox");
    return { count, retained: box.contains(existing),
      value: existing.style.getPropertyValue("--ae-scrollbar-x"),
      priority: existing.style.getPropertyPriority("--ae-scrollbar-x") };
  });
  expect(result).toEqual({ count: 1, retained: true, value: "7px", priority: "important" });
});

test("the horizontal thumb maps its drag to horizontal scroll", async ({ page }) => {
  await setup(page, `<div id="box" data-ae-scrollbox data-ae-scrollbar="x"
    style="width:120px;height:120px;overflow-x:auto;overflow-y:hidden">
    <div style="width:600px;height:100px"></div>
  </div>`);
  const track = page.locator("#box > [data-ae-scrollbar-horizontal]");
  const thumb = await track.evaluate(element =>
    Number.parseFloat(element.style.getPropertyValue("--ae-scrollbar-thumb-size")));
  const rect = await track.boundingBox();
  await page.mouse.move(rect.x + thumb / 2, rect.y + 4);
  await page.mouse.down();
  await page.mouse.move(rect.x + 95, rect.y + 4, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => document.getElementById("box").scrollLeft))
    .toBeGreaterThan(300);
});
