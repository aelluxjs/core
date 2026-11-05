const trigger = document.getElementById("floating-trigger");
const panel = document.getElementById("floating-panel");
let returnFocus = false;

$ae.onEvent(document.getElementById("trigger-position"), "$input", event => {
  // Move the target as application layout; Anchor does all placement calculations.
  trigger.style.marginTop = `${event.target.value}px`;
  $ae.dispatchFrom(trigger, "Layout", {
    detail: { origin: "example.triggerPosition", durationMs: 0 }
  });
});
$ae.onEvent(panel, "BeforeDismiss", () => {
  returnFocus = panel.contains(document.activeElement);
});
$ae.onEvent(panel, "Dismiss", () => {
  if (returnFocus) trigger.focus({ preventScroll: true });
});
$ae.on("$keydown", event => {
  if (event.key !== "Escape" || trigger.getAttribute("aria-expanded") !== "true") return;
  event.preventDefault();
  $ae("floating-panel").present.dismiss().catch(error => console.error("Unable to close the panel.", error));
});
