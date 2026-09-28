import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Eta } from "eta";
import MarkdownIt from "markdown-it";
import { generateDocs, resolveTemplate, sitemap } from "@wolimp/docweaver";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsPath = path.join(projectRoot, "docs-source");
const outputDirectory = path.join(projectRoot, "docs");
const publicPrefix = process.env.DOCS_PUBLIC_PREFIX ?? "/core";
const outputPath = path.posix.join(
  "/",
  publicPrefix,
  path.relative(projectRoot, outputDirectory).replaceAll(path.sep, `/`)
);
const baseURL = process.env.DOCS_BASE_URL ?? `https://aelluxjs.github.io${outputPath}`;
const siteURL = baseURL.replace(/\/+$/, ``);
const themeDirectory = path.dirname(resolveTemplate());
const eta = new Eta({ views: themeDirectory });
const markdown = new MarkdownIt({ html: true });
const versions = (await fsp.readdir(docsPath, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => ({ name: entry.name }));

const generatedDocs = await generateDocs({
  docsPath,
  baseURL,
  title: "aellux.js"
});
const sourceToTarget = new Map(generatedDocs.filter(({ render }) => render?.view?.markdownPath).map(({ targetPath, render }) => [
  `/${path.relative(docsPath, render.view.markdownPath).replaceAll(path.sep, `/`)}`,
  targetPath
]));
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
    const destination = sourceToTarget.get(resolved) ?? (pagePaths.has(resolved) ? resolved : null);
    if (!destination) return match;
    const suffix = href.slice(pathname.length);
    const publishedHref = pathname.startsWith(`/`)
      ? `${outputPath}${destination}${suffix}`
      : `${path.posix.relative(path.posix.dirname(targetPath), destination)}${suffix}`;
    return `href=${quote}${publishedHref}${quote}`;
  });
}

for (const generated of generatedDocs) {
  if (generated.status !== 200 || !generated.render) {
    throw new Error(`Failed to generate ${generated.targetPath}: ${generated.body ?? generated.status}`);
  }

  const { template, view } = generated.render;
  const targetFile = path.resolve(outputDirectory, `.${generated.targetPath}`);
  const version = generated.targetPath.split(`/`)[1];
  const contentHtml = markdown.render(await fsp.readFile(view.markdownPath, "utf8"));
  const pageURL = `${siteURL}${generated.targetPath}`;
  const structuredDataJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: view.pageTitle,
    url: pageURL,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: view.breadcrumb.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: item.href
          ? `${siteURL}${sourceToTarget.get(item.href) ?? item.href}`
          : pageURL
      }))
    }
  }).replace(/</g, "\\u003c");
  const html = eta.render(path.basename(template), {
    ...view,
    contentHtml,
    title: "aellux.js Docs",
    description: "Documentation for the aellux.js browser runtime and Extensions.",
    outputPath,
    pageURL,
    structuredDataJson,
    version,
    versions
  });

  await fsp.mkdir(path.dirname(targetFile), { recursive: true });
  await fsp.writeFile(targetFile, updateDocLinks(html, generated.targetPath), "utf8");
  if (path.basename(view.markdownPath).toLowerCase() === "readme.md") {
    await fsp.rm(path.join(path.dirname(targetFile), "README.htm"), { force: true });
  }
}

const sitemapResult = await sitemap(docsPath, baseURL);
if (sitemapResult.status !== 200) {
  throw new Error(`Failed to generate sitemap: ${sitemapResult.body}`);
}

await fsp.mkdir(outputDirectory, { recursive: true });
await fsp.writeFile(
  path.join(outputDirectory, "sitemap.xml"),
  sitemapResult.body
    .replace(/\/README\.md(?=<\/loc>)/gi, `/index.htm`)
    .replace(/\.md(?=<\/loc>)/g, `.htm`),
  "utf8"
);

for (const folder of ["css", "js"]) {
  await fsp.cp(
    path.join(themeDirectory, folder),
    path.join(outputDirectory, folder),
    { recursive: true, force: true }
  );
}
