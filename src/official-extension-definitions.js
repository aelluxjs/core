/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Approval is deliberately explicit. Merely adding an aellux.ext.* source file
// must never make an extension official.
export const officialExtensionDefinitions = Object.freeze([
  Object.freeze({ name: "preference", style: false, dependencies: Object.freeze([]) }),
  Object.freeze({ name: "state-navigation", style: false, dependencies: Object.freeze([]) }),
  Object.freeze({ name: "feedback", style: true, dependencies: Object.freeze([]) }),
  Object.freeze({ name: "focus", style: false, dependencies: Object.freeze([]) }),
  Object.freeze({ name: "point", style: false, dependencies: Object.freeze([]) }),
  Object.freeze({ name: "anchor", style: false, dependencies: Object.freeze([]) }),
  Object.freeze({ name: "scrollbox", style: false, dependencies: Object.freeze([]) }),
  Object.freeze({ name: "scrollbox-snap", style: false, dependencies: Object.freeze([]) }),
  Object.freeze({ name: "adaptive", style: true, dependencies: Object.freeze([]) }),
  Object.freeze({ name: "present", style: true, dependencies: Object.freeze([]) })
]);
