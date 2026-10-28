/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

import { hasProgressAPI } from "./has-progress-api.js";

// Small element-local fallback. Attributes remain the single source of truth.
export function installProgressFallback(root, element) {
  const tag = element.tagName.toLowerCase();
  if (hasProgressAPI(root, tag)) return null;
  const api = root.AelluxJs;
  const marker = api.attr("progress-fallback");
  const names = tag === "progress" ? ["value", "max", "position"] :
    ["value", "min", "max", "low", "high", "optimum"];
  const descriptors = names.map(name => Object.getOwnPropertyDescriptor(element, name));
  const memory = api.persist.element.save(element,
    [marker, "role", "aria-valuemin", "aria-valuemax", "aria-valuenow"],
    ["display", "position", "width", "height", "background", "overflow"]);
  let active = true;
  const bar = element.ownerDocument.createElement("span");
  bar.setAttribute("aria-hidden", "true");
  bar.style.cssText = "position:absolute;left:0;top:0;height:100%;pointer-events:none";
  element.appendChild(bar);
  element.setAttribute(marker, tag);
  // Only unsupported controls receive structure/styles; original children stay.
  element.style.cssText += ";display:inline-block;position:relative;width:10em;height:1em;background:#ddd;overflow:hidden";
  element.setAttribute("role", tag === "progress" ? "progressbar" : "meter");
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function number(name, fallback) {
    const raw = element.getAttribute(name);
    const value = raw === null || raw.trim() === "" ? NaN : Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }
  function read(name) {
    const min = tag === "progress" ? 0 : number("min", 0);
    const rawMax = number("max", 1);
    const max = tag === "progress" ? (rawMax > 0 ? rawMax : 1) : Math.max(min, rawMax);
    if (name === "min") return min;
    if (name === "max") return max;
    const value = clamp(number("value", 0), min, max);
    if (name === "value") return value;
    if (name === "position") return element.hasAttribute("value") ? value / max : -1;
    const low = clamp(number("low", min), min, max);
    if (name === "low") return low;
    if (name === "high") return clamp(number("high", max), low, max);
    return clamp(number("optimum", (min + max) / 2), min, max);
  }
  function render() {
    if (!active) return;
    const min = tag === "progress" ? 0 : read("min");
    const max = read("max");
    const value = read("value");
    const indeterminate = tag === "progress" && !element.hasAttribute("value");
    element.setAttribute("aria-valuemin", String(min));
    element.setAttribute("aria-valuemax", String(max));
    if (indeterminate) element.removeAttribute("aria-valuenow");
    else element.setAttribute("aria-valuenow", String(value));
    bar.style.width = `${indeterminate ? 100 : max === min ? 0 : (value - min) / (max - min) * 100}%`;
    bar.style.background = indeterminate ? "#777" : "#2878b5";
    if (indeterminate) bar.style.backgroundImage = "repeating-linear-gradient(45deg,#777 0,#777 8px,#bbb 8px,#bbb 16px)";
    if (tag === "meter") {
      const low = read("low"), high = read("high"), optimum = read("optimum");
      const level = optimum < low ? (value <= low ? 0 : value <= high ? 1 : 2) :
        optimum > high ? (value >= high ? 0 : value >= low ? 1 : 2) :
          (value >= low && value <= high ? 0 : 1);
      bar.style.background = ["#278341", "#b58212", "#bc3131"][level];
    }
  }
  names.forEach(name => Object.defineProperty(element, name, {
    configurable: true, enumerable: true, get: () => read(name),
    ...(name === "position" ? {} : { set(value) {
      value = Number(value);
      if (!Number.isFinite(value)) throw new TypeError("Expected a finite number");
      element.setAttribute(name, String(value));
      render();
    } })
  }));
  const observer = new root.MutationObserver(render);
  observer.observe(element, { attributes: true,
    attributeFilter: ["value", "min", "max", "low", "high", "optimum"] });
  render();
  return { destroy() {
    active = false;
    observer.disconnect();
    if (bar.parentNode) bar.parentNode.removeChild(bar);
    names.forEach((name, index) => {
      if (descriptors[index]) Object.defineProperty(element, name, descriptors[index]);
      else delete element[name];
    });
    memory.restore();
  } };
}
