const steps = document.getElementById("setup-steps");
const names = { project: "Project", style: "Style", preview: "Preview" };
let selectedStep;
async function selectStep(snapshot, focus = true) {
  const id = Object.keys(names).includes(snapshot.step) ? snapshot.step : "project";
  if (id === selectedStep) return;
  selectedStep = id;
  document.getElementById("preview-name").textContent = document.getElementById("project-name").value || "Your workspace";
  for (const button of document.querySelectorAll("nav [data-step]")) {
    if (button.dataset.step === id) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  }
  if (await $ae(steps).present.show(id) && focus) document.querySelector("#" + id + " h2").focus({ preventScroll: true });
}
function navigate(id) {
  $ae.ext.stateNavigation.setState("step", id, names[id]).catch(console.error);
}
$ae.on("SnapshotChange", event => { selectStep(event.detail.snapshot).catch(console.error); });
$ae.on("SnapshotRestore", event => { selectStep(event.detail.snapshot).catch(console.error); });
$ae.on("Ready", () => {
  selectStep($ae.ext.stateNavigation.globalSnapshot, false).catch(console.error);
});
document.addEventListener("click", event => {
  const button = event.target.closest("[data-step]");
  if (button) navigate(button.dataset.step);
});
document.getElementById("project-form").addEventListener("submit", event => {
  event.preventDefault();
  navigate("style");
});
document.getElementById("preview-width").addEventListener("input", event => {
  document.getElementById("workspace-preview").style.width = event.target.value + "px";
});
document.getElementById("create-preview").addEventListener("click", () => {
  $ae("setup-feedback").feedback.success("Your local preview is ready. Keep making good things.");
});
