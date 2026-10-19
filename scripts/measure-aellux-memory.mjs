import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

const server = spawn(process.execPath, ["tests/browser/server.mjs"], { stdio: "ignore" });
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const bytesToMiB = bytes => Math.round(bytes / 1024 / 1024 * 100) / 100;

try {
  await delay(500);
  const source = await readFile("docs/teste.htm", "utf8");
  const body = source.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1];
  if (!body) throw new Error("Body de docs/teste.htm não encontrado.");

  const browser = await chromium.launch({ headless: true });
  const samples = [];
  for (let index = 0; index < 3; index++) {
    const page = await browser.newPage();
    await page.goto("http://127.0.0.1:4173/tests/index.htm");
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${body}</body></html>`);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("HeapProfiler.collectGarbage");
    const before = await cdp.send("Runtime.getHeapUsage");

    await page.addScriptTag({ url: "http://127.0.0.1:4173/dist/aellux.js" });
    await page.evaluate(() => AelluxJs.init({ mode: "full" }));
    await page.waitForFunction(() => AelluxJs.ext.scrollbox?.initialized && AelluxJs.ext.present?.initialized);
    await page.waitForTimeout(300);
    await cdp.send("HeapProfiler.collectGarbage");
    const after = await cdp.send("Runtime.getHeapUsage");
    samples.push({ before: before.usedSize, after: after.usedSize, delta: after.usedSize - before.usedSize });
    await page.close();
  }
  await browser.close();

  const deltas = samples.map(sample => sample.delta);
  const average = deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
  console.log(JSON.stringify({
    samples: samples.map(sample => ({
      beforeMiB: bytesToMiB(sample.before), afterMiB: bytesToMiB(sample.after), deltaMiB: bytesToMiB(sample.delta)
    })),
    averageDeltaMiB: bytesToMiB(average),
    minDeltaMiB: bytesToMiB(Math.min(...deltas)),
    maxDeltaMiB: bytesToMiB(Math.max(...deltas))
  }, null, 2));
} finally {
  server.kill();
}
