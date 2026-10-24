let tocInitialized = false;

const tocOptions = {
  tocSelector: ".js-toc",
  contentSelector: ".js-toc-content",
  headingSelector: "h1, h2, h3, h4",
  hasInnerContainers: false,

  // If your header is fixed, adjust these values.
  // headingsOffset: 120,
  // scrollSmoothOffset: -80,
  scrollSmooth: false,

  // Optional
  collapseDepth: 3,
  orderedList: false,
  activeLinkClass: "is-active-link",
  activeListItemClass: "is-active-li",
  scrollEndCallback: function (e) {
    // Example: Adjust active link position
    const active = document.querySelector('.is-active-link');
    active.scrollIntoView({
      block: "center",
      container: "nearest",
      behavior: "smooth"
    });
    const currentLabel = document.getElementById('tocbot-current-label');
    if (active && currentLabel) currentLabel.innerText = active.innerText;
  }
};

async function initOrRefreshToc() {
  if (!tocbot) return;
  ensureHeadingIds(document.querySelector(tocOptions.contentSelector));

  const hasHeadings = document.querySelector(
    `${tocOptions.contentSelector} ${tocOptions.headingSelector}`
  );

  const toc = document.querySelector(tocOptions.tocSelector);

  if (!hasHeadings) {
    if (toc) toc.innerHTML = "";
    return;
  }

  //await promise_value(window, "tocbot");

  if (!tocInitialized) {
    tocbot.init(tocOptions);
    tocInitialized = true;
    tocbot._options?.scrollEndCallback();
  } else {
    tocbot.refresh(tocOptions);
    tocbot._options?.scrollEndCallback();
  }

  toc?.querySelectorAll("a[href]").forEach((link) => {
    link.setAttribute("data-ae-dismiss", "toc-collapse");
  });
}

function ensureHeadingIds(container) {
  if (!container) return;

  const used = new Set(
    Array.from(container.querySelectorAll("[id]"))
      .map((element) => element.id)
  );

  container.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
    if (heading.id) return;

    const base = slugifyHeading(heading.textContent || "section");
    let id = base;
    let count = 2;

    while (used.has(id)) {
      id = `${base}-${count}`;
      count += 1;
    }

    heading.setAttribute("id", id);
    heading.innerHTML = `
    <a href='#${id}' style='text-decoration: none;color: inherit;margin-left:-5px;'>
      <svg class="svg-icon align-middle opacity-50" style="font-size:0.5em" aria-hidden="true" focusable="false"><use href="#bi-link-45deg"></use></svg>${heading.innerText}
    </a>`;
    used.add(id);
  });
}

function slugifyHeading(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
