'use strict';

import fsp from "node:fs/promises";
import path from "node:path";

function formatXML(url, item) {
  const location = `${String(url).replace(/\/+$/, ``)}/${String(item.href).replace(/^\/+/, ``)}`;
  return `<url><loc>${location.replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`)}</loc></url>`;
}

async function sitemap(docsPath, baseURL) {
  const entries = await fsp.readdir(
    docsPath, { withFileTypes: true }
  ) ?? [];
  let xmlBody = ``;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const version = entry.name;
    try {
      const summarySource = await fsp.readFile(
        `${docsPath}/${version}/summary.json`,
        { encoding: `utf8` }
      );

      const parsed = JSON.parse(String(summarySource ?? ``));

      for (const item of flattenSummaryOrder(parsed.summary ?? [], version)) {
        if (!item.hasChildren) xmlBody += formatXML(baseURL, item);
      }
    } catch (error) {
      return {
        status: 500,
        body: `Failed to load ${version} summary.json: ${error.message}`
      };
    }
  }

  return {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=432000' // 1 hour Browser // 5 days CDN
    },
    body: `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${xmlBody}
      </urlset>`
  };
}

async function generateDocs({
  docsPath,
  baseURL,
  title
}) {
  const docs = [];

  async function visit(version, directory, relativeDirectory = ``) {
    const entries = await fsp.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(version, entryPath, relativePath);
        continue;
      }

      if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== `.md`) continue;

      const sourceFilePath = relativePath;
      const targetHTML = entry.name.toLowerCase() === `readme.md`
        ? path.posix.join(relativeDirectory, `index.htm`)
        : relativePath.replace(/\.md$/i, `.htm`);
      const generated = await generate({ docsPath, baseURL, title, version, sourceFilePath });
      docs.push({ ...generated, targetPath: `/${version}/${targetHTML}` });
    }
  }

  const versions = await fsp.readdir(docsPath, { withFileTypes: true });
  for (const entry of versions) {
    if (!entry.isDirectory()) continue;
    await visit(entry.name, path.join(docsPath, entry.name));
  }

  return docs;
}

async function generate({
  docsPath,
  version,
  title,
  sourceFilePath
}) {
  const docsRoot = path.resolve(docsPath, version);
  const source = String(sourceFilePath ?? `README.md`).replace(/\\/g, `/`).replace(/^\/+/, ``);
  const relativeFile = source.endsWith(`.md`) ? source : `${source}.md`;
  const markdownPath = path.resolve(docsRoot, relativeFile);
  if (!markdownPath.startsWith(`${docsRoot}${path.sep}`)) {
    return { status: 400, body: `Invalid documentation path` };
  }
  try {
    await fsp.access(markdownPath);
  } catch {
    return { status: 404, body: `Documentation page not found` };
  }
  const slug = path.basename(relativeFile, `.md`);


  let menuTree = [];
  let breadcrumb = [];
  let parsed = null;
  let prevPage = null;
  let nextPage = null;

  try {
    const configSource = await fsp.readFile(
      `${docsPath}/${version}/summary.json`,
      { encoding: `utf8` }
    );

    parsed = JSON.parse(String(configSource ?? ``));

    const currentPath = `/${version}/${relativeFile}`;

    menuTree = normalizeMenuTree(
      parsed.summary ?? [],
      version,
      currentPath
    );

    breadcrumb = buildBreadcrumb(menuTree, {
      currentPath,
      homeLabel: `Home`,
      homeHref: `/${version}/README.md`
    });

    const docsNavigation = buildDocsPrevNext(parsed.summary ?? [], {
      version,
      currentPath,
      homeLabel: `Home`,
      homeHref: `/${version}/README.md`
    });

    prevPage = docsNavigation.prev;
    nextPage = docsNavigation.next;

  } catch (error) {
    return {
      status: 500,
      body: `Failed to load summary.json: ${error.message}`
    };
  }

  let pageTitle = `${version} | ${title}`;

  if (breadcrumb.length > 1) {
    pageTitle = `${breadcrumb[breadcrumb.length - 1].label} | ${pageTitle}`;
  }

  //ADD PREFFIX TO SUMMARY PAGES WHEN APPROPRIATE
  if (breadcrumb.at(-1)?.label === "Summary" && breadcrumb.length > 2) {
    pageTitle = `${breadcrumb[breadcrumb.length - 2].label} - ${pageTitle}`;
  }


  return {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=432000' // 1 hour Browser // 5 days CDN
    },
    render: {
      template: parsed.template ?? `templates/docs-layout.e.htm`,
      view: {
        menuTree,
        pageTitle,
        breadcrumb,
        markdownPath,
        prevLink: prevPage,
        nextLink: nextPage,
        currentSlug: slug,
        currentPath: `/${version}/${relativeFile}`
      }
    }
  };
};

function normalizeMenuTree(items = [], version, currentPath = `/`) {
  const current = stripQueryAndHash(currentPath);

  return (Array.isArray(items) ? items : []).map((item) => {
    const hasHref =
      item.href !== undefined &&
      item.href !== null &&
      String(item.href).trim() !== ``;

    const href = hasHref ? prefixVersion(item.href, version) : null;

    const children = normalizeMenuTree(
      item.children ?? [],
      version,
      current
    );

    const selfActive = href === current;
    const childActive = children.some((child) => child.active === true);

    return {
      ...item,
      href,
      active: selfActive || childActive,
      children
    };
  });
}

function stripQueryAndHash(path) {
  return String(path ?? `/`)
    .split(`#`)[0]
    .split(`?`)[0];
}

function prefixVersion(href, version) {
  const normalized = String(href ?? ``)
    .trim()
    .replace(/^\/+/, ``);

  if (!normalized) {
    return `/${version}/README.md`;
  }

  return `/${version}/${normalized}`;
}

function buildBreadcrumb(menuTree = [],
  {
    currentPath = `/`,
    homeLabel = `Home`,
    homeHref = `/`
  } = {}
) {
  const current = stripQueryAndHash(currentPath);
  const normalizedHomeHref = stripQueryAndHash(homeHref);

  const activePath = findActivePath(menuTree);

  const breadcrumb = [];

  // Add Home only when current page is not the home page
  if (current !== normalizedHomeHref) {
    breadcrumb.push({
      id: 1,
      label: homeLabel,
      href: homeHref
    });
  } else {
    breadcrumb.push({
      id: 1,
      label: homeLabel
    });
  }

  for (const item of activePath) {
    const label = getItemLabel(item);

    // Ignore "Overview" in breadcrumb
    if (isIgnoredBreadcrumbLabel(label)) {
      continue;
    }

    let itemHref = item.breadcrumbHref ?? item.href ?? null;

    if (itemHref) {
      if (stripQueryAndHash(itemHref) === normalizedHomeHref)
        continue;
    }

    breadcrumb.push({
      id: breadcrumb.length + 1,
      label,
      href: itemHref || (item.children ? item.children[0].href : undefined)
    });
  }

  // Last breadcrumb item never has href
  if (breadcrumb.length > 0) {
    delete breadcrumb[breadcrumb.length - 1].href;
  }

  return breadcrumb;
}

function isIgnoredBreadcrumbLabel(label) {
  return String(label ?? ``)
    .trim()
    .toLowerCase() === `overview`;
}

function findActivePath(items = [], parents = []) {
  for (const item of Array.isArray(items) ? items : []) {
    const path = [...parents, item];

    if (item.active === true) {
      const childPath = findActivePath(item.children ?? [], path);

      if (childPath.length > path.length) {
        return childPath;
      }

      return path;
    }
  }

  return [];
}

function getItemLabel(item = {}) {
  return String(
    item.label ??
    item.title ??
    item.name ??
    `Untitled`
  );
}

function buildDocsPrevNext(
  items = [],
  {
    version,
    currentPath = `/`,
    homeLabel = `Home`,
    homeHref = `/README.md`
  } = {}
) {
  const home = {
    label: homeLabel,
    href: homeHref
  };

  const homePath = normalizeDocsPath(homeHref, version);
  const current = normalizeDocsPath(currentPath, version);

  const ordered = flattenSummaryOrder(items, version).map((item) => ({
    ...item,
    normalizedHref: normalizeDocsPath(item.href, version)
  }));

  // Only pages WITHOUT children are valid prev/next targets.
  const isNavigationPage = (item) =>
    item?.hasHref === true &&
    item?.hasChildren !== true &&
    item.normalizedHref !== homePath;

  const firstPage = ordered.find(isNavigationPage) ?? null;

  // Homepage has only next.
  if (current === homePath) {
    return {
      prev: null,
      next: firstPage ? toNavPage(firstPage) : null
    };
  }

  const currentIndex = ordered.findIndex(
    (item) => item.normalizedHref === current
  );

  if (currentIndex === -1) {
    return {
      prev: null,
      next: null
    };
  }

  let prev = null;

  for (let i = currentIndex - 1; i >= 0; i -= 1) {
    if (isNavigationPage(ordered[i])) {
      prev = toNavPage(ordered[i]);
      break;
    }
  }

  if (!prev) {
    prev = home;
  }

  let next = null;

  for (let i = currentIndex + 1; i < ordered.length; i += 1) {
    if (isNavigationPage(ordered[i])) {
      next = toNavPage(ordered[i]);
      break;
    }
  }

  // Last page points next to homepage.
  if (!next) {
    next = home;
  }

  return {
    prev,
    next
  };
}

function flattenSummaryOrder(items = [], version) {
  const ordered = [];

  for (const item of Array.isArray(items) ? items : []) {
    const children = Array.isArray(item.children) ? item.children : [];
    const hasChildren = children.length > 0;

    const hasHref =
      item.href !== undefined &&
      item.href !== null &&
      String(item.href).trim() !== ``;

    // Keep parent entries only as position markers.
    // They will never be returned as prev/next when hasChildren === true.
    if (hasHref) {
      ordered.push({
        label: getItemLabel(item),
        href: prefixVersion(item.href, version),
        hasHref: true,
        hasChildren
      });
    }

    // Children are declared immediately after the parent,
    // so the first valid child becomes the next page.
    if (hasChildren) {
      ordered.push(...flattenSummaryOrder(children, version));
    }
  }

  return ordered;
}

function toNavPage(item = {}) {
  return {
    label: item.label,
    href: item.href
  };
}

function normalizeDocsPath(path, version) {
  let normalized = stripQueryAndHash(path)
    .trim()
    .replace(/\/{2,}/g, `/`);

  if (!normalized.startsWith(`/`)) {
    normalized = `/${normalized}`;
  }

  const versionRoot = `/${version}`;

  if (normalized === versionRoot || normalized === `${versionRoot}/`) {
    return `${versionRoot}/README.md`;
  }

  return normalized.replace(/\/+$/, ``) || `/`;
}

export default { sitemap, generateDocs };
