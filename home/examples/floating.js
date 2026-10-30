const trigger = document.getElementById("floating-trigger");
const panel = document.getElementById("floating-panel");
let returnFocus = false;

document.getElementById("trigger-position").addEventListener("input", event => {
  // Move the target as application layout; Anchor does all placement calculations.
  trigger.style.marginTop = `${event.target.value}px`;
  $ae.dispatchFrom(trigger, "Layout", {
    detail: { origin: "example.triggerPosition", durationMs: 0 }
  });
});
panel.addEventListener($ae.eventName("BeforeUnpop"), () => {
  returnFocus = panel.contains(document.activeElement);
});
panel.addEventListener($ae.eventName("Unpop"), () => {
  if (returnFocus) trigger.focus({ preventScroll: true });
});
document.addEventListener("keydown", event => {
  if (event.key !== "Escape" || trigger.getAttribute("aria-expanded") !== "true") return;
  event.preventDefault();
  $ae("floating-panel").present.unpop().catch(error => console.error("Unable to close the panel.", error));
});
