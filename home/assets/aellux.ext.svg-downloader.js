/*! aellux.js homepage | SPDX-License-Identifier: Apache-2.0 */
(function () {
  "use strict";

  const api = window.AelluxJs;
  const attribute = api.attr("svg-downloader");
  // Freeze presentation while the original still has its theme ancestors.
  const presentation = [
    "color", "fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity",
    "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset",
    "opacity", "paint-order", "visibility", "display", "font-family", "font-size", "font-style",
    "font-weight", "font-stretch", "font-variant", "letter-spacing", "word-spacing", "text-anchor",
    "dominant-baseline", "text-decoration", "stop-color", "stop-opacity", "flood-color", "flood-opacity"
  ];

  api.extAttach("svg-downloader", {
    init() { document.addEventListener("click", onClick); },
    destroy() { document.removeEventListener("click", onClick); }
  });

  function snapshot(svg) {
    const clone = svg.cloneNode(true);
    const originals = [svg, ...svg.querySelectorAll("*")];
    const copies = [clone, ...clone.querySelectorAll("*")];
    originals.forEach((original, index) => {
      const computed = getComputedStyle(original);
      presentation.forEach(property => {
        copies[index].style.setProperty(property, computed.getPropertyValue(property), "important");
      });
    });
    // The exported file no longer needs selectors that refer to the host page.
    clone.querySelectorAll("style").forEach(style => style.remove());
    clone.removeAttribute("class");
    const viewBox = svg.viewBox.baseVal;
    const width = svg.width.baseVal.value || viewBox.width;
    const height = svg.height.baseVal.value || viewBox.height;
    if (!(width > 0 && height > 0)) throw new Error("SVG dimensions must be positive.");
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", width);
    clone.setAttribute("height", height);
    return { blob: new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" }), width, height };
  }

  async function rasterize({ blob, width, height }) {
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("SVG image could not be loaded."));
        image.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("PNG export is unavailable.");
      context.drawImage(image, 0, 0, width, height);
      return await new Promise((resolve, reject) => canvas.toBlob(result => {
        if (result) resolve(result);
        else reject(new Error("PNG export failed."));
      }, "image/png"));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function onClick(event) {
    const button = event.target.closest(`button[${attribute}]`);
    if (!button || button.disabled) return;
    const status = button.closest("article")?.querySelector('[role="status"]');
    button.disabled = true;
    if (status) status.textContent = "Preparing download…";
    try {
      const svg = document.getElementById(button.getAttribute(attribute));
      if (!(svg instanceof SVGSVGElement)) throw new Error("SVG target was not found.");
      const format = button.getAttribute(api.attr("svg-format")) || "svg";
      if (format !== "svg" && format !== "png") throw new Error("Unsupported export format.");
      const resolved = snapshot(svg);
      const blob = format === "png" ? await rasterize(resolved) : resolved.blob;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${button.getAttribute(api.attr("svg-filename")) || svg.id || "image"}.${format}`;
      document.body.append(link);
      link.click();
      link.remove();
      // Keep the URL alive long enough for the browser to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (status) status.textContent = "Download ready.";
    } catch (error) {
      if (status) status.textContent = `Download failed. ${error.message}`;
    } finally {
      button.disabled = false;
    }
  }
})();
