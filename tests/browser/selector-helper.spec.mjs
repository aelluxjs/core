import { expect, test } from "@playwright/test";

for (const boot of ["aellux.js", "aellux.min.js"]) {
  test(`public selector helpers validate browser syntax before initialization (${boot})`, async ({ page }) => {
    await page.goto("/tests/index.htm");
    await page.addScriptTag({ url: `/dist/${boot}` });
    const result = await page.evaluate(() => {
      const historyLength = $ae.diagnostics.showHistory().length;
      const parse = $ae.parseSelectors;
      const valid = $ae.isValidSelector;
      const nested = ':is(main, :not(article, aside)), [data-region="a,b"]';
      const escaped = String.raw`#region\,`;
      const escapedQuote = String.raw`[data-label="a\",b"]`;
      const comment = 'main/* comma, brackets [ and quote " */';
      const invalidInputs = [null, undefined, 123, false, {}, "", " ", [],
        ["main", null], ["main", ""], ["main", "["], "main,", ",main", "main,,aside",
        "[", "main)", ':not(main', '[data-label="unterminated]', 'main/* unfinished'];
      const failures = [];
      const rejected = invalidInputs.map(input => parse(input, invalid => failures.push(invalid)) === null);
      const cause = [];
      parse(["main", "["], invalid => cause.push({ value: invalid.value, native: invalid.cause instanceof Error }));
      return {
        aliases: valid === AelluxJs.isValidSelector && parse === AelluxJs.parseSelectors,
        valid: ["#missing-selector-probe", "main, aside", ":is(main, aside)", "::before"].map(valid),
        invalid: [null, undefined, [], {}, false, 123, "", " ", "[", "main,,aside"].map(valid),
        missing: document.querySelector("#missing-selector-probe"),
        parsed: parse([` ${nested} `, escaped, escapedQuote, comment, "main, aside", "main"]),
        rejected, failures: failures.length, cause,
        silent: historyLength === $ae.diagnostics.showHistory().length
      };
    });
    expect(result).toEqual({
      aliases: true, valid: [true, true, true, true], invalid: Array(10).fill(false), missing: null,
      parsed: [':is(main, :not(article, aside))', '[data-region="a,b"]', String.raw`#region\,`,
        String.raw`[data-label="a\",b"]`, 'main/* comma, brackets [ and quote " */', "main", "aside"],
      rejected: Array(19).fill(true), failures: 19,
      cause: [{ value: "[", native: true }], silent: true
    });
  });
}

test("ES module entry exposes the same selector helpers", async ({ page }) => {
  await page.goto("/tests/index.htm");
  const result = await page.evaluate(async () => {
    const { default: api } = await import("/dist/aellux.esm.js");
    return { valid: api.isValidSelector("#missing-selector-probe"), parsed: api.parseSelectors("main, main, aside") };
  });
  expect(result).toEqual({ valid: true, parsed: ["main", "aside"] });
});

test("extAttach revalidates changed loadWhen declarations and preserves native causes", async ({ page }) => {
  await page.goto("/tests/index.htm");
  await page.addScriptTag({ url: "/dist/aellux.js" });
  const result = await page.evaluate(() => {
    const api = { init() {} };
    $ae.ext("changed-selector", { loadWhen: "main" });
    $ae.registry.ext.changedSelector.loadWhen = "[";
    $ae.extAttach("changed-selector", api);
    const blocked = !$ae.ext.changedSelector && $ae.registry.ext.changedSelector.state === "wait";
    $ae.registry.ext.changedSelector.loadWhen = "#future-content";
    $ae.extAttach("changed-selector", api);
    $ae.ext("changed-type", { loadWhen: "main" });
    $ae.registry.ext.changedType.loadWhen = 42;
    $ae.extAttach("changed-type", api);
    const entries = $ae.diagnostics.showHistory().filter(entry => entry.code === 1112);
    return { blocked, retried: $ae.ext.changedSelector === api, typeBlocked: !$ae.ext.changedType,
      entries: entries.map(({ context }) => ({ extension: context.extension, argument: context.argument,
        selector: context.selector, cause: context.cause instanceof Error, expected: context.expected })) };
  });
  expect(result).toEqual({ blocked: true, retried: true, typeBlocked: true, entries: [
    { extension: "changed-selector", argument: "loadWhen", selector: "[", cause: true, expected: undefined },
    { extension: "changed-type", argument: "loadWhen", selector: 42, cause: false, expected: "a valid nonempty CSS selector" }
  ] });
});
