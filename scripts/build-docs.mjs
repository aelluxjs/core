import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ERenderer from "./e-renderer/e-renderer-runtime.mjs";
import docsGeneration from "../templates/docs/docs-generation.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsPath = path.join(projectRoot, "docs-source");
const outputDirectory = path.join(projectRoot, "docs");
const outputPath = `/${path.relative(projectRoot, outputDirectory).replaceAll(path.sep, `/`)}`;
const baseURL = process.env.DOCS_BASE_URL ?? `https://aelluxjs.github.io${outputPath}`;
const renderer = new ERenderer();

const generatedDocs = await docsGeneration.generateDocs({
  docsPath,
  baseURL,
  title: "aellux.js"
});
const sourcePaths = new Set(generatedDocs.map(({ targetPath }) => targetPath.replace(/\.htm$/i, `.md`)));
const pagePaths = new Set(generatedDocs.map(({ targetPath }) => targetPath));

function updateDocLinks(html, targetPath) {
  return html.replace(/\bhref=(['"])([^'"]+)\1/g, (match, quote, href) => {
    if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith(`#`)) return match;
    const pathname = href.split(/[?#]/, 1)[0];
    const localPath = pathname.startsWith(`${outputPath}/`)
      ? pathname.slice(outputPath.length)
      : pathname;
    const resolved = localPath.startsWith(`/`)
      ? path.posix.normalize(localPath)
      : path.posix.resolve(path.posix.dirname(targetPath), localPath);
    if (!sourcePaths.has(resolved) && !pagePaths.has(resolved)) return match;
    const renderedHref = href.replace(/\.md(?=[?#]|$)/i, `.htm`);
    const publishedHref = pathname.startsWith(`/`) && !pathname.startsWith(`${outputPath}/`)
      ? `${outputPath}${renderedHref}`
      : renderedHref;
    return `href=${quote}${publishedHref}${quote}`;
  });
}

for (const generated of generatedDocs) {
  if (generated.status !== 200 || !generated.render) {
    throw new Error(`Failed to generate ${generated.targetPath}: ${generated.body ?? generated.status}`);
  }

  const { template, view } = generated.render;
  const templateFile = path.resolve(projectRoot, "templates", "docs", path.basename(template));
  const targetFile = path.resolve(outputDirectory, `.${generated.targetPath}`);
  const version = generated.targetPath.split(`/`)[1];
  const markdownPath = path.relative(projectRoot, view.markdownPath).replaceAll(path.sep, `/`);
  const stream = await renderer.renderView(templateFile, {
    view: { ...view, markdownPath, outputPath },
    route: {
      params: { version },
      folders: { assetsRootFolder: projectRoot }
    }
  });

  let html = ``;
  for await (const chunk of stream) html += String(chunk);
  await fsp.mkdir(path.dirname(targetFile), { recursive: true });
  await fsp.writeFile(targetFile, updateDocLinks(html, generated.targetPath), "utf8");
}

const sitemap = await docsGeneration.sitemap(docsPath, baseURL);
if (sitemap.status !== 200) {
  throw new Error(`Failed to generate sitemap: ${sitemap.body}`);
}

await fsp.mkdir(outputDirectory, { recursive: true });
await fsp.writeFile(
  path.join(outputDirectory, "sitemap.xml"),
  sitemap.body.replace(/\.md(?=<\/loc>)/g, `.htm`),
  "utf8"
);

for (const folder of ["css", "js"]) {
  await fsp.cp(
    path.join(projectRoot, "templates", "docs", folder),
    path.join(outputDirectory, folder),
    { recursive: true, force: true }
  );
}
