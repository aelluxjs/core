(() => {
  const AJAX_ATTRIBUTE = "ajax-load";
  const AJAX_SELECTOR = `[${AJAX_ATTRIBUTE}]`;
  let currentRequest = null;

  const progressBar = document.querySelector("#page-progress");
  let progressTimer = null, progressTimer1 = null, progressTimer2 = null;

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

  function comparableUrl(value) {
    const url = new URL(value, window.location.href);

    // Match by path + query, ignoring hash
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
    let collapse = element.closest(".collapse:not(.show)");

    while (collapse) {
      if (collapse.id && collapse.getAttribute('data-bs-parent')) {
        const selector = `[data-bs-toggle][data-bs-target="#${collapse.id}"]`;
        const button = document.querySelector(selector);
        button.click();
      }

      collapse = collapse.parentElement?.closest(".collapse:not(.show)");
    }
  }

  function removeNavActiveByUrl(url) {
    const target = comparableUrl(url);

    document.querySelectorAll(".nav-link[href].active").forEach((link) => {
      const linkUrl = comparableUrl(link.href);

      if (linkUrl === target) {
        link.classList.remove("active");
      }
    });
  }

  async function loadPage(url, push = true) {
    const ajaxContent = document.querySelectorAll(AJAX_SELECTOR);
    const previousUrl = new URL(window.location.href);

    if (!ajaxContent.length === 0) {
      window.location.href = url.href;
      return;
    }

    if (currentRequest) {
      currentRequest.abort();
    }

    currentRequest = new AbortController();

    startProgress();

    window.dispatchEvent(new CustomEvent('BootstrapAjaxStart', { detail: null }));

    // Remove active from the current/pre-change URL
    removeNavActiveByUrl(previousUrl);

    try {
      ajaxContent.forEach(el => el.setAttribute("aria-busy", "true"));

      const response = await fetch(url.href, {
        method: "GET",
        credentials: "same-origin",
        signal: currentRequest.signal,
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        }
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const finalUrl = response.url;

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const newContent = doc.querySelectorAll(AJAX_SELECTOR);

      if (!newContent)
        throw new Error(`Response does not contain ${AJAX_SELECTOR} tags`);

      if (doc.title) document.title = doc.title;

      newContent.forEach(el => {
        const ajaxTarget = el.getAttribute(AJAX_ATTRIBUTE);
        const targetElement = document.querySelector(`[${AJAX_ATTRIBUTE}='${ajaxTarget}']`);
        targetElement.innerHTML = el.innerHTML;
      });

      window.dispatchEvent(new CustomEvent('BootstrapAjaxLoaded', { detail: null }));

      if (doc.title) {
        document.title = doc.title;
      }

      if (push) {
        history.pushState({}, "", finalUrl);
        rememberCurrentUrl(finalUrl);
      }

      // Add active to the new/current URL
      setNavActiveByUrl(new URL(finalUrl, window.location.href));

      window.scrollTo({ top: 0, behavior: "instant" });

    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(error);
        setNavActiveByUrl(previousUrl);
        window.location.href = finalUrl;
      }
    } finally {
      ajaxContent.forEach(el => el.removeAttribute("aria-busy"));
      finishProgress();
      currentRequest = null;
    }
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");

    if (!link) return;

    const rawHref = link.getAttribute("href")?.trim() ?? "";

    if (rawHref.startsWith("#")) {
      return;
    }

    // Ignore new tab/window clicks, downloads, external targets, and opt-out links
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target ||
      link.hasAttribute("download") ||
      link.hasAttribute("data-no-ajax")
    ) {
      return;
    }

    const url = new URL(rawHref, window.location.href);

    // Only handle links from the same host
    if (url.host !== window.location.host) {
      return;
    }

    // Let pure hash navigation behave normally
    const samePage =
      url.pathname === window.location.pathname &&
      url.search === window.location.search;

    if (samePage && url.hash) {
      return;
    }

    event.preventDefault();
    loadPage(url);
  });

  window.addEventListener("popstate", () => {
    const nextUrl = new URL(window.location.href);

    if (lastKnownUrl.href === window.location.href) {
      return;
    } else if (isOnlyHashChange(lastKnownUrl, nextUrl)) {
      rememberCurrentUrl(nextUrl);
      return;
    }

    rememberCurrentUrl(nextUrl);
    loadPage(nextUrl, false);
  });

  let lastKnownUrl = new URL(window.location.href);

  function isOnlyHashChange(previousUrl, nextUrl) {
    return (
      previousUrl.origin === nextUrl.origin &&
      previousUrl.pathname === nextUrl.pathname &&
      previousUrl.search === nextUrl.search &&
      previousUrl.hash !== nextUrl.hash
    );
  }

  function rememberCurrentUrl(url = window.location.href) {
    lastKnownUrl = new URL(url, window.location.href);
  }
})();