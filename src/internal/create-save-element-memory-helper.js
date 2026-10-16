/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Keep this helper ES5-compatible: it is also bundled into the boot script.
export function createSaveElementMemoryHelper() {
  return { save: saveElementMemory };
}

function saveElementMemory(element, attributes, cssProperties) {
  if (!element || typeof element.hasAttribute !== "function" ||
    typeof element.setAttribute !== "function" || !element.style) {
    throw new TypeError("persist.element.save requires an element");
  }
  if (typeof attributes === "undefined") attributes = [];
  if (typeof cssProperties === "undefined") cssProperties = [];
  if (!Array.isArray(attributes) || !Array.isArray(cssProperties)) {
    throw new TypeError("persist.element.save requires arrays of attributes and CSS properties");
  }

  var savedAttributes = Object.create(null);
  var savedCssProperties = Object.create(null);
  var style = element.style;
  var i;

  for (i = 0; i < attributes.length; i++) {
    var attribute = attributes[i];
    savedAttributes[attribute] = {
      present: element.hasAttribute(attribute),
      value: element.getAttribute(attribute)
    };
  }

  for (i = 0; i < cssProperties.length; i++) {
    var property = cssProperties[i];
    var value = style.getPropertyValue(property);
    var priority = style.getPropertyPriority(property);
    var present = value !== "" || priority !== "";
    if (!present) {
      for (var j = 0; j < style.length; j++) {
        if (style.item(j) === property) {
          present = true;
          break;
        }
      }
    }
    savedCssProperties[property] = {
      present: present,
      value: value,
      priority: priority
    };
  }

  return {
    attributes: savedAttributes,
    cssProperties: savedCssProperties,
    restore: function () {
      if (!element || typeof element.setAttribute !== "function" || !element.style) return false;
      for (var name in savedAttributes) {
        if (!Object.prototype.hasOwnProperty.call(savedAttributes, name)) continue;
        var savedAttribute = savedAttributes[name];
        if (savedAttribute.present) element.setAttribute(name, savedAttribute.value);
        else element.removeAttribute(name);
      }
      for (var cssName in savedCssProperties) {
        if (!Object.prototype.hasOwnProperty.call(savedCssProperties, cssName)) continue;
        var savedCss = savedCssProperties[cssName];
        if (savedCss.present) element.style.setProperty(cssName, savedCss.value, savedCss.priority);
        else element.style.removeProperty(cssName);
      }
      return true;
    }
  };
}
