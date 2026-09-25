/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize, relative } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const scenarios = [
  "html-web-platform.html",
  "bootstrap-integration.html",
  "dynamic-update.html",
  "extension-eager.html",
  "extension-lazy.html",
  "extension-with-css.html",
  "extension-without-css.html",
  "extension-modern-only.html",
  "extension-legacy-only.html",
  "lifecycle-init-idempotence.html",
  "lifecycle-element-mount-unmount.html",
  "lifecycle-extension-destroy.html",
  "lifecycle-core-destroy.html",
  "runtime-modern.html",
  "runtime-legacy-forced.html",
  "extension-modern-legacy.html",
  "extension-failure-isolation.html"
];
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

const browser = await findBrowser();
const profileDirectory = await mkdtemp(join(tmpdir(), "aellux-validation-"));
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const requestedPath = normalize(join(projectRoot, pathname));
    const relativePath = relative(projectRoot, requestedPath);
    if (relativePath.startsWith("..")) throw new Error("Path outside project");
    const content = await readFile(requestedPath);
    response.writeHead(200, { "Content-Type": contentTypes[extname(requestedPath)] || "application/octet-stream" });
    response.end(content);
  } catch (error) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
let failures = 0;

try {
  for (const scenario of scenarios) {
    const url = `http://127.0.0.1:${port}/tests/browser/${scenario}`;
    try {
      const { stdout } = await execFileAsync(browser, [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-sync",
        "--metrics-recording-only",
        "--no-sandbox",
        `--user-data-dir=${profileDirectory}`,
        "--virtual-time-budget=20000",
        "--dump-dom",
        url
      ], { maxBuffer: 20 * 1024 * 1024, timeout: 30000 });

      if (!/data-test-status="passed"/.test(stdout)) {
        const message = stdout.match(/data-test-message="([^"]*)"/);
        throw new Error(message ? message[1] : "Page did not report success");
      }
      console.log(`PASS ${scenario}`);
    } catch (error) {
      failures++;
      console.error(`FAIL ${scenario}: ${error.message}`);
    }
  }
} finally {
  await new Promise(resolve => server.close(resolve));
  await rm(profileDirectory, { recursive: true, force: true });
}

if (failures) process.exitCode = 1;

async function findBrowser() {
  const candidates = process.platform === "win32"
    ? [
      process.env.AELLUX_TEST_BROWSER,
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
    ]
    : [process.env.AELLUX_TEST_BROWSER, "/usr/bin/google-chrome", "/usr/bin/chromium"];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      await access(candidate);
      return candidate;
    } catch (error) {
    }
  }
  throw new Error("Chrome or Edge was not found. Set AELLUX_TEST_BROWSER.");
}
