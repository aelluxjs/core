import { readFile, readdir } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { bundleBudget } from "./bundle-budget.config.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const distDirectory = join(projectRoot, "dist");
const failures = [];
const budgetedFiles = new Set();

for (const budget of bundleBudget) {
  if (budgetedFiles.has(budget.file)) {
    console.error(`Duplicate bundle budget: ${budget.file}`);
    process.exitCode = 1;
  }
  budgetedFiles.add(budget.file);
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

for (const file of await readdir(distDirectory)) {
  if (/\.min\.(?:js|css)$/.test(file) && !budgetedFiles.has(file)) {
    console.error(`Missing bundle budget: ${file}`);
    process.exitCode = 1;
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
