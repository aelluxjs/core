const gallery = document.getElementById("gallery");
const previous = document.getElementById("previous-card");
const next = document.getElementById("next-card");
const focus = document.getElementById("carousel-focus");
const count = gallery.querySelectorAll("[data-ae-snap-item]").length;

$ae.onEvent(gallery, "ScrollboxSnapChange", event => {
  const index = event.detail.index;
  // Anchor owns placement; the inner square owns the independent scale pulse.
  focus.setAttribute("data-ae-anchor-target", event.detail.item.id);
  document.getElementById("carousel-position").textContent = `Card ${index + 1} of ${count}`;
  previous.disabled = index === 0;
  next.disabled = index === count - 1;
});
$ae.onEvent(previous, "$click", () => $ae("gallery").scrollbox.previous());
$ae.onEvent(next, "$click", () => $ae("gallery").scrollbox.next());
