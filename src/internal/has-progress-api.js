/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// ES5: shared by bootstrap capability selection and the Legacy Extension.
// Probe detached elements so detection never changes application controls.
export function hasProgressAPI(root, tag) {
  try {
    var ctor = root[tag === "progress" ? "HTMLProgressElement" : "HTMLMeterElement"];
    if (typeof ctor !== "function") return false;
    var element = root.document.createElement(tag);
    var names = tag === "progress" ? ["value", "max", "position"] :
      ["value", "min", "max", "low", "high", "optimum"];
    for (var i = 0; i < names.length; i++) {
      if (typeof element[names[i]] !== "number" || !isFinite(element[names[i]])) return false;
    }
    element.setAttribute("max", "10");
    element.setAttribute("value", "5");
    if (element.max !== 10 || element.value !== 5) return false;
    element.value = 20;
    if (element.value !== 10 || element.getAttribute("value") !== "20") return false;
    if (tag === "progress") {
      element.removeAttribute("value");
      return element.position === -1 && element.value === 0;
    }
    element.setAttribute("min", "2");
    element.setAttribute("low", "3");
    element.setAttribute("high", "8");
    element.setAttribute("optimum", "6");
    return element.min === 2 && element.low === 3 && element.high === 8 && element.optimum === 6;
  } catch (error) { return false; }
}
