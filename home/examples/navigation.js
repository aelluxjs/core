const boundary = document.getElementById("navigation-demo");
const status = document.getElementById("navigation-status");
let pending = 0;

function publish(type, message) {
  // Feedback renders the message; the example supplies the live region and styles.
  status.classList.remove("ae--feedback-busy", "ae--feedback-success", "ae--feedback-error");
  $ae.ext.feedback.send({ type, message, target: boundary });
}

function updateNavigation() {
  document.querySelectorAll("a[data-ae-ajax-href]").forEach(link => {
    if (new URL(link.href).pathname === location.pathname) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

$ae.on("AjaxHrefStart", () => {
  pending += 1;
  boundary.setAttribute("aria-busy", "true");
  publish("busy", "Loading the next panel…");
});
$ae.on("AjaxHrefLoaded", () => {
  updateNavigation();
  const content = document.getElementById("navigation-content");
  content.focus({ preventScroll: true });
  publish("success", `Loaded ${content.querySelector("h2").textContent}.`);
});
$ae.on("AjaxHrefError", event => {
  const { error, status } = event.detail;
  if (error?.name === "AbortError") return;
  publish("error", status === 404
    ? "That page was not found (404). Your current panel is still here."
    : "Unable to load this panel. Please try again.");
});
$ae.on("AjaxHrefComplete", () => {
  // Completion also covers failed, aborted and superseded attempts; it is not success.
  pending = Math.max(0, pending - 1);
  boundary.setAttribute("aria-busy", String(pending > 0));
});
$ae.on("Ready", () => {
  updateNavigation();
  document.getElementById("navigation-error").disabled = false;
});
document.getElementById("navigation-error").addEventListener("click", () => {
  // Deliberately request a nonexistent document to demonstrate a real HTTP failure.
  const url = new URL("unavailable-demo.htm", location.href).href;
  $ae.ext.ajaxHref.load(url, "#navigation-content", { ignoreHistory: true }).catch(() => {
    // AjaxHrefError already forwards the original cause to the presentation above.
  });
});

$ae.ext("preference");
$ae.ext("feedback");
$ae.ext("state-navigation");
$ae.ext("ajax-href");
$ae.init({
  mode: "basic",
  useHash: false,
  extensions: { preference: { syncBootstrapThemeTag: true } }
});
