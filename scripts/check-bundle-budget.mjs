import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { bundleBudget } from "./bundle-budget.config.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const distDirectory = join(projectRoot, "dist");
const failures = [];

for (const budget of bundleBudget) {
  const content = await readFile(join(distDirectory, budget.file));
  const rawBytes = content.length;
  const gzipBytes = gzipSync(content, { level: 9 }).length;
  const rawStatus = rawBytes <= budget.maxRawBytes ? "ok" : "over";
  const gzipStatus = gzipBytes <= budget.maxGzipBytes ? "ok" : "over";

  console.log(
    `${budget.file}: raw ${formatBytes(rawBytes)}/${formatBytes(budget.maxRawBytes)} ${rawStatus}; ` +
    `gzip ${formatBytes(gzipBytes)}/${formatBytes(budget.maxGzipBytes)} ${gzipStatus}`
  );

  if (rawStatus === "over" || gzipStatus === "over") {
    failures.push({ file: budget.file, rawBytes, gzipBytes, budget });
  }
}

if (failures.length > 0) {
  console.error("Bundle budget exceeded:");
  for (const { file, rawBytes, gzipBytes, budget } of failures) {
    console.error(
      `- ${file}: raw ${formatBytes(rawBytes)} (limit ${formatBytes(budget.maxRawBytes)}), ` +
      `gzip ${formatBytes(gzipBytes)} (limit ${formatBytes(budget.maxGzipBytes)})`
    );
  }
  process.exitCode = 1;
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
