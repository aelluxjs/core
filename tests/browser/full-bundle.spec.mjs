import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

const sourceFiles = await readdir(join(process.cwd(), "src"));
const coreExtensions = (await Promise.all(sourceFiles.map(async filename => {
  const name = /^aellux\.ext\.([^.]+)\.js$/.exec(filename)?.[1];
  if (!name) return null;
  const source = await readFile(join(process.cwd(), "src", filename), "utf8");
  return /AelluxJs\.extAttach\(/.test(source)
    ? name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    : null;
}))).filter(Boolean).sort();

for (const { boot, forceLegacy } of [
  { boot: "aellux.js", forceLegacy: false },
  { boot: "aellux.min.js", forceLegacy: false },
  { boot: "aellux.js", forceLegacy: true },
  { boot: "aellux.min.js", forceLegacy: true }
]) {
  test(`full ${boot} keeps only foundational extensions eager with forceLegacy=${forceLegacy}`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: `/dist/${boot}` });
    await page.evaluate(forceLegacy => AelluxJs.init({ mode: "full", forceLegacy }), forceLegacy);
    await expect.poll(() => page.evaluate(() =>
      ["preference", "stateNavigation", "scrollbox"].filter(name =>
        AelluxJs.ext[name]?.initialized !== true)
    )).toEqual([]);

    const state = await page.evaluate(() => ({
      bundled: Object.keys(AelluxJs.bundledExtensions).sort(),
      registered: Object.keys(AelluxJs.registry.ext).sort(),
      lazy: Object.keys(AelluxJs.registry.lazyExtSelectors).sort(),
      externalScripts: [...document.querySelectorAll(`script[${AelluxJs.attr("ext")}]`)]
        .map(script => script.getAttribute(AelluxJs.attr("ext"))),
      legacy: AelluxJs.diagnostics.legacy
    }));
    expect(state).toEqual({
      bundled: ["preference", "scrollbox", "stateNavigation"],
      registered: coreExtensions,
      lazy: ["adaptive", "anchor", "feedback", "focus", "point", "present"],
      externalScripts: [],
      legacy: forceLegacy
    });
  });
}
