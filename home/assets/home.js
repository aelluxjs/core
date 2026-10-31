document.addEventListener("click", async event => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const code = document.getElementById(button.dataset.copy);
  const status = button.closest(".source-file")?.querySelector('[role="status"]') || document.getElementById("copy-status");
  try {
    await navigator.clipboard.writeText(code.textContent);
    status.textContent = "Copied to clipboard.";
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(code);
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = "Clipboard unavailable. The code is selected; use your device’s copy command.";
  }
});

let highlightReady = null;
let highlightStylesReady = false;

function prepareCodeScrollboxes() {
  document.querySelectorAll("pre:not([data-ae-scrollbox])").forEach(pre => {
    pre.setAttribute("data-ae-scrollbox", "pointer");
    pre.setAttribute("data-ae-scrollbar", "horizontal");
    if (!pre.parentElement.classList.contains("code-wrapper")) {
      const wrapper = document.createElement("div");
      wrapper.className = "code-wrapper";
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.append(pre);
    }
  });
}

$ae.on("BeforeMount", prepareCodeScrollboxes);

function syncHighlightTheme() {
  if (!highlightStylesReady) return;
  const dark = $ae.currentPreference("color-scheme") === "dark";
  const lightStyle = document.querySelector('link[data-ae-dep="highlightjs-css"]');
  const darkStyle = document.querySelector('link[data-ae-dep="highlightjs-css-dark"]');
  if (lightStyle) lightStyle.disabled = dark;
  if (darkStyle) darkStyle.disabled = !dark;
}

function getHighlighter() {
  if (!highlightReady) {
    // Shared dependencies for the hero, setup snippets and example sources.
    const baseUrl = "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.12/";
    highlightReady = (async () => {
      await Promise.all([
        $ae.dep("highlightjs", `${baseUrl}highlight.min.js`),
        $ae.dep("highlightjs-css", `${baseUrl}styles/github.min.css`),
        $ae.dep("highlightjs-css-dark", `${baseUrl}styles/github-dark.min.css`)
      ]);
      highlightStylesReady = true;
      await Promise.all(["xml", "javascript", "css", "bash"].filter(language => !window.hljs.getLanguage(language))
        .map(language => $ae.dep(`highlightjs-${language}`, `${baseUrl}languages/${language}.min.js`)));
      syncHighlightTheme();
      return window.hljs;
    })().catch(error => {
      highlightReady = null;
      throw error;
    });
  }
  return highlightReady;
}

$ae.on("PreferencesChange", syncHighlightTheme);

getHighlighter().then(highlighter => {
  document.querySelectorAll(".hero pre code, #getting-started pre code").forEach(code => {
    if (!code.dataset.highlighted) highlighter.highlightElement(code);
  });
}).catch(error => {
  console.error("Failed to highlight the homepage code.", error);
});

// Source is fetched from the same files executed by each standalone example.
function createSourcePanel(id) {
  const panel = document.createElement("div");
  panel.id = id;
  panel.className = "source-panel";
  panel.setAttribute("data-ae-present", "height");
  panel.setAttribute("data-ae-unpop-on-click", "false");
  panel.hidden = true;
  const content = document.createElement("div");
  content.className = "source-motion";
  content.setAttribute("data-ae-present-motion", "");
  panel.append(content);
  return { panel, content };
}

document.querySelectorAll("[data-example-source]").forEach(details => {
  const example = details.dataset.exampleSource;
  const source = createSourcePanel(`source-panel-${example}`);
  details.append(source.panel);
  const files = [`examples/${example}.htm`];
  if (example !== "viewport") files.push(`examples/${example}.js`);
  files.push("assets/examples.css");
  if (example === "navigation") files.splice(1, 0, "examples/navigation-details.htm", "examples/navigation-activity.htm");
  const standalone = document.createElement("a");
  standalone.href = files[0];
  standalone.target = "_blank";
  standalone.rel = "noopener";
  standalone.className = "d-inline-block small my-3";
  standalone.textContent = "Open standalone example ↗";
  source.content.append(standalone);

  files.forEach((file, index) => {
    const fileDetails = document.createElement("div");
    fileDetails.className = "source-file";
    const summary = document.createElement("button");
    summary.type = "button";
    summary.className = "source-toggle";
    summary.textContent = file;
    const fileSource = createSourcePanel(`source-file-${example}-${index}`);
    summary.setAttribute("data-ae-trigger", "toggle");
    summary.setAttribute("data-ae-target", `#${fileSource.panel.id}`);
    summary.setAttribute("aria-controls", fileSource.panel.id);
    summary.setAttribute("aria-expanded", "false");
    const pre = document.createElement("pre");
    pre.className = "border rounded-2 mt-3 mb-2";
    const code = document.createElement("code");
    code.id = `source-${example}-${index}`;
    code.className = `language-${file.endsWith(".js") ? "javascript" : file.endsWith(".css") ? "css" : "xml"}`;
    pre.append(code);
    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "btn btn-sm btn-outline-secondary";
    copy.dataset.copy = code.id;
    copy.textContent = "Copy file";
    copy.setAttribute("aria-label", `Copy ${file}`);
    copy.disabled = true;
    const status = document.createElement("p");
    status.className = "small text-body-secondary mt-2 mb-0";
    status.setAttribute("role", "status");
    fileSource.content.append(pre, copy, status);
    fileDetails.append(summary, fileSource.panel);
    source.content.append(fileDetails);
    let loading = false;
    fileSource.panel.addEventListener($ae.eventName("BeforePop"), async event => {
      if (event.target !== fileSource.panel || loading || code.dataset.highlighted) return;
      loading = true;
      status.textContent = "Loading source…";
      try {
        if (copy.disabled) {
          const response = await fetch(file);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          code.textContent = await response.text();
          copy.disabled = false;
        }
        status.textContent = "";
        try {
          const highlighter = await getHighlighter();
          highlighter.highlightElement(code);
        } catch {
          status.textContent = "Syntax highlighting is unavailable. You can still read and copy the source; reopen the file to retry.";
        }
      } catch {
        status.textContent = "Source could not be loaded. Close and reopen this file to retry, or open the standalone example.";
      } finally {
        loading = false;
      }
    });
  });
});

prepareCodeScrollboxes();
