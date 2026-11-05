const card = document.getElementById("floating-trigger");
const panel = document.getElementById("floating-panel");
document.getElementById("trigger-position").addEventListener("input", event => {
  card.style.marginTop = event.target.value + "px";
  $ae.dispatchFrom(card, "Layout", { detail: { origin: "example.position", durationMs: 0 } });
});
panel.addEventListener("input", event => {
  const target = event.target.id === "workspace-name" ? card.querySelector("h2") : document.getElementById("workspace-reminder");
  target.textContent = event.target.value;
});
// Focus handles restoration when Present hides the editor.
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !panel.hidden) {
    event.preventDefault();
    $ae("floating-panel").present.dismiss().catch(console.error);
  }
});
