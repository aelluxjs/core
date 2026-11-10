import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

for (const file of ["aellux.esm.js", "aellux.esm.min.js"]) {
  test(`${file} exposes the canonical global in an environment without window`, () => {
    const url = new URL(`../../dist/${file}`, import.meta.url).href;
    // A fresh process avoids altering the test runner's globals or module cache.
    const result = execFileSync(process.execPath, ["--input-type=module", "-e", `
      const { default: api } = await import(${JSON.stringify(url)});
      console.log(JSON.stringify({
        noWindow: typeof window === "undefined",
        shared: api === globalThis.aelluxJs && api === globalThis.$ae,
        hasOldGlobal: Object.prototype.hasOwnProperty.call(globalThis, "AelluxJs"),
        hasBrandAlias: Object.prototype.hasOwnProperty.call(globalThis, "aellux"),
        attribute: api.attr("focus")
      }));
    `], { encoding: "utf8" });
    assert.deepEqual(JSON.parse(result), { noWindow: true, shared: true,
      hasOldGlobal: false, hasBrandAlias: false, attribute: "data-ae-focus" });
  });
}
