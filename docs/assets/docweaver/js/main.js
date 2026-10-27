const tocbotReady = (async () => {
  const css = "https://cdn.jsdelivr.net/npm/tocbot@4.32/dist/tocbot.min.css";
  const initUrl = new URL("toc-init.js", document.currentScript.src).href;
  const baseUrl = "https://cdn.jsdelivr.net/npm/tocbot@4.32/dist/tocbot.min.js";
  await Promise.all([
    AelluxJs.dep("tocbot", baseUrl),
    AelluxJs.dep("tocbot-css", css),
    AelluxJs.dep("tocbot-init", initUrl)
  ]);
  initOrRefreshToc();
  return window.tocbot;
})().catch(error => {
  console.error("Failed to load tocbot.", error);
  return null;
});

const highlightReady = (async () => {
  const baseUrl = "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.12/";
  const cssUrl = baseUrl + "styles/github.min.css";
  const cssDarkUrl = baseUrl + "styles/github-dark.min.css";
  await Promise.all([
    AelluxJs.dep("highlightjs", `${baseUrl}highlight.min.js`),
    AelluxJs.dep("highlightjs-css", cssUrl),
    AelluxJs.dep("highlightjs-css-dark", cssDarkUrl)
  ]);
  await Promise.all(["xml", "json", "bash", "javascript"].map(language =>
    AelluxJs.dep(`highlightjs-${language}`, `${baseUrl}languages/${language}.min.js`)
  ));

  updateHljsScheme();
  AelluxJs.on("PreferencesChange", updateHljsScheme);

  return window.hljs;
})().catch(error => {
  console.error("Failed to load syntax highlighting.", error);
  return null;
});

function updateHljsScheme() {
  const colorScheme = document.documentElement.getAttribute("data-ae-color-scheme");
  const light = document.querySelector("link[data-ae-dep='highlightjs-css']");
  const dark = document.querySelector("link[data-ae-dep='highlightjs-css-dark']");
  if (colorScheme === "dark") {
    dark.removeAttribute("disabled");
    light.setAttribute("disabled", "disabled");
  } else {
    light.removeAttribute("disabled");
    dark.setAttribute("disabled", "disabled");
  }
}

async function highlightCode() {
  const highlighter = await highlightReady;
  if (!highlighter) return;
  if (document.readyState === "loading") {
    await new Promise(resolve => document.addEventListener("DOMContentLoaded", resolve, { once: true }));
  }
  document.querySelectorAll('pre:not(.hljs)').forEach(block => {
    block.classList.add("hljs");
  });
  document.querySelectorAll('pre code:not([data-highlighted])').forEach(block => {
    highlighter.highlightElement(block);
  });
}

/** INITIALIZE AELLUXJS **/

AelluxJs.init({ mode: "full", environment: "development" });

function prepareAjaxLinks() {
  const ajaxAttr = AelluxJs.attr("ajax-href");
  document.querySelectorAll(`.article a[href]:not([${ajaxAttr}]),nav a[href]:not([${ajaxAttr}])`)
    .forEach((link) => {
      if (link.getAttribute("href")?.startsWith("#")) return;
      link.setAttribute(ajaxAttr, "title,#doc-content,#doc-navlinks,#doc-navlinks2,#doc-breadcrumb");
    });
}

AelluxJs.on("BeforeMount", (event) => {
  if ("initOrRefreshToc" in window) { initOrRefreshToc(); }
  highlightCode();
  prepareAjaxLinks();

  document.querySelectorAll("table:not([data-ae-scrollbox])")
    .forEach((table) => {
      if (table.parentElement &&
        table.parentElement.classList.contains("table-scroll-wrapper")) {
        return;
      }
      //table.setAttribute("data-ae-scrollbox-elastic", "");
      const wrapper = document.createElement("div");
      wrapper.classList.add("table-scroll-wrapper");
      wrapper.setAttribute("data-ae-scrollbox", "pointer");
      wrapper.setAttribute("data-ae-scrollbar", "horizontal");
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });

  document.querySelectorAll("pre:not([data-ae-scrollbox])")
    .forEach((element) => {
      element.setAttribute("data-ae-scrollbox", "pointer");
      element.setAttribute("data-ae-scrollbar", "horizontal");
      const wrapper = document.createElement("div");
      wrapper.classList.add("code-wrapper")
      element.parentNode.insertBefore(wrapper, element);
      wrapper.appendChild(element);
    });
});

AelluxJs.on("AjaxHrefStart", (e) => {
  const container = document.querySelector("#doc-content");
  container.style.transition = null;
  container.style.opacity = .2;
  setNavActiveByUrl(e.detail.url);
  $ae('navbarSupportedContent').present.unpop();
  window.scrollTo({ top: 0 });
});

AelluxJs.on("AjaxHrefComplete", (e) => {
  const container = document.querySelector("#doc-content");
  container.style.transition = "opacity .25s linear";
  container.style.opacity = null;
});

AelluxJs.on("AjaxHrefError", (e) => {
  const { error, status } = e.detail;
  if (error?.name === "AbortError") return;

  let message = "Unable to load this page. Please try again.";
  if (status === 404) message = "Page not found.";
  else if (status === 403) message = "You do not have permission to access this content.";
  else if (status === 429) message = "Too many requests. Please try again later.";
  else if (status >= 500 && status <= 599) message = "The server encountered a problem. Please try again later.";
  else if (error?.name === "TimeoutError") message = "The request took too long. Please try again.";
  else if (error?.name === "TypeError") {
    message = navigator.onLine === false
      ? "Please check your internet connection."
      : "Unable to connect to the server.";
  }
  $ae(document.body).feedback.error(message, null, "no");
  setNavActiveByUrl(window.location.href);
});

function comparableUrl(value) {
  const url = new URL(value, window.location.href);
  return `${url.origin}${url.pathname}${url.search}`;
}

function setNavActiveByUrl(url) {
  const target = comparableUrl(url);
  document.querySelectorAll(".nav-link[href]").forEach((link) => {
    const linkUrl = comparableUrl(link.href);
    const navItem = link.closest(".nav-item");

    navItem?.classList.toggle("active", linkUrl === target);
    if (linkUrl === target) openAllParentCollapses(navItem);
  });
}

function openAllParentCollapses(element) {
  let collapse = element.closest(".docs-menu-panel");

  while (collapse) {
    AelluxJs(collapse).present.toggle(true);
    collapse = collapse.parentElement?.closest(".docs-menu-panel");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let currentRequest = null;
  let progressTimer = null, progressTimer1 = null, progressTimer2 = null;
  const progressBar = document.querySelector("#page-progress");

  AelluxJs.on("AjaxHrefStart", startProgress);
  AelluxJs.on("AjaxHrefComplete", finishProgress);

  function startProgress() {
    if (!progressBar) return;

    clearInterval(progressTimer);
    clearInterval(progressTimer1);
    clearInterval(progressTimer2);
    progressBar.style.transition = "none";
    progressBar.style.opacity = "1";
    progressBar.style.width = "10%";

    let progress = 10;
    progressTimer = setInterval(() => {
      progress += Math.random() * 12;
      if (progress > 85) progress = 85;
      progressBar.style.transition = null;
      progressBar.style.width = `${progress}%`;
    }, 200);
  }

  function finishProgress() {
    if (!progressBar) return;

    clearInterval(progressTimer);
    clearInterval(progressTimer1);
    clearInterval(progressTimer2);
    progressBar.style.width = "100%";
    progressTimer1 = setTimeout(() => progressBar.style.opacity = "0", 200);
    progressTimer2 = setTimeout(() => progressBar.style.width = "0%", 450);
  }
});
