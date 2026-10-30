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

// Source is fetched from the same files executed by each standalone example.
document.querySelectorAll("[data-example-source]").forEach(details => {
  const example = details.dataset.exampleSource;
  const files = [`examples/${example}.htm`, `examples/${example}.js`, "assets/examples.css"];
  if (example === "navigation") files.splice(1, 0, "examples/navigation-details.htm", "examples/navigation-activity.htm");
  const standalone = document.createElement("a");
  standalone.href = files[0];
  standalone.target = "_blank";
  standalone.rel = "noopener";
  standalone.className = "d-inline-block small my-3";
  standalone.textContent = "Open standalone example ↗";
  details.append(standalone);

  files.forEach((file, index) => {
    const fileDetails = document.createElement("details");
    fileDetails.className = "source-file";
    const summary = document.createElement("summary");
    summary.textContent = file;
    const pre = document.createElement("pre");
    pre.className = "bg-body-tertiary border rounded-2 p-3 mt-3 mb-2";
    const code = document.createElement("code");
    code.id = `source-${example}-${index}`;
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
    fileDetails.append(summary, pre, copy, status);
    details.append(fileDetails);
    let loading = false;
    fileDetails.addEventListener("toggle", async () => {
      if (!fileDetails.open || loading || !copy.disabled) return;
      loading = true;
      status.textContent = "Loading source…";
      try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        code.textContent = await response.text();
        copy.disabled = false;
        status.textContent = "";
      } catch {
        status.textContent = "Source could not be loaded. Close and reopen this file to retry, or open the standalone example.";
      } finally {
        loading = false;
      }
    });
  });
});
