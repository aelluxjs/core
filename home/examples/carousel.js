const gallery = document.getElementById("gallery");
const previous = document.getElementById("previous-card");
const next = document.getElementById("next-card");
const count = gallery.querySelectorAll("[data-ae-snap-item]").length;

gallery.addEventListener($ae.eventName("ScrollboxSnapChange"), event => {
  const index = event.detail.index;
  document.getElementById("carousel-position").textContent = `Card ${index + 1} of ${count}`;
  previous.disabled = index === 0;
  next.disabled = index === count - 1;
});
previous.addEventListener("click", () => $ae("gallery").scrollbox.previous());
next.addEventListener("click", () => $ae("gallery").scrollbox.next());
