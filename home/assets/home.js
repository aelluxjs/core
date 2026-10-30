document.querySelectorAll("[data-copy]").forEach(button => {
  button.addEventListener("click", async () => {
    const code = document.getElementById(button.dataset.copy);
    const status = document.getElementById("copy-status");
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
});

// Only Preference is needed while the four live examples are placeholders.
function syncThemeControls() {
  document.querySelectorAll('[data-ae-preference="color-scheme"] [data-ae-option]').forEach(button => {
    button.setAttribute("aria-pressed", String(button.classList.contains("ae--active")));
  });
}

$ae.on("PreferencesChange", syncThemeControls);
$ae.on("Ready", syncThemeControls);
$ae.ext("preference");
$ae.init({
  mode: "basic",
  extensions: {
    preference: { syncBootstrapThemeTag: true }
  }
});
