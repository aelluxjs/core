const gallery = document.getElementById("gallery");
// Scrollbox owns drag/touch; these controls only request native scrolling.
for (const [id, direction] of [["previous-card", -1], ["next-card", 1]]) {
  document.getElementById(id).addEventListener("click", () => {
    gallery.scrollBy({ left: direction * gallery.clientWidth * .8,
      behavior: $ae.currentPreference("reduced-motion") === "reduced" ? "instant" : "smooth" });
  });
}
