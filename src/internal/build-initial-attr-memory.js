/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Created on first use so the ES5 boot script can load before legacy polyfills.
var savedAttributes;

export function saveAttr(target, attributes) {
  if (!savedAttributes) savedAttributes = new WeakMap();
  var snapshot = [];
  for (var i = 0; i < attributes.length; i++) {
    var name = attributes[i];
    snapshot.push([name, target.getAttribute(name)]);
  }
  savedAttributes.set(target, snapshot);
}

export function restoreAttr(target) {
  if (!savedAttributes) return;
  var snapshot = savedAttributes.get(target);
  if (!snapshot) return;
  for (var i = 0; i < snapshot.length; i++) {
    var name = snapshot[i][0];
    var value = snapshot[i][1];
    if (value === null) target.removeAttribute(name);
    else target.setAttribute(name, value);
  }
  savedAttributes.delete(target);
}
