/*! Aellux | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Required compatibility: ES5. This helper is bundled into the Aellux boot script and must not
// introduce runtime syntax or APIs that prevent the Legacy fallback path from being reached.

export function buildPersistMemory(root, name, identifier) {
  var defaultIdentifier = identifier ? identifier : "AelluxPersist";
  var target;

  try {
    target = root[name] || null;
    if (!target ||
      typeof target.setItem !== "function" ||
      typeof target.getItem !== "function") {
      throw new Error("Storage unavailable");
    }
  } catch (error) {
    target = {
      data: {},
      setItem: function (key, value) { this.data[key] = value; },
      getItem: function (key) { return this.data[key] ? this.data[key] : null; }
    };
  }

  var fallback = {
    data: {},
    keys: function () {
      var keys = [];
      for (var key in this.data) {
        if (Object.prototype.hasOwnProperty.call(this.data, key)) {
          keys.push(key);
        }
      }
      return keys;
    },
    get: function (key) { return this.data[key] ? this.data[key] : null; },
    set: function (key, value) { this.data[key] = value; },
    toString: function () { return JSON.stringify(this.data); }
  };

  function getData() {
    if (typeof root.URLSearchParams !== "undefined")
      return new root.URLSearchParams(target.getItem(defaultIdentifier) || "");

    fallback.data = JSON.parse(target.getItem(defaultIdentifier) || "{}");
    return fallback;
  }

  return {
    get: function (key, fallbackValue) {
      return getData().get(key) || fallbackValue;
    },
    set: function (key, value) {
      var data = getData();
      data.set(key, value);
      return target.setItem(defaultIdentifier, data.toString());
    },
    setObject: function (object) {
      var data = getData();
      for (var key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          data.set(key, object[key]);
        }
      }
      return target.setItem(defaultIdentifier, data.toString());
    },
    getObject: function () {
      var data = getData();
      var object = {};
      var keys = data.keys();
      if (typeof keys.next === "function") {
        var entry = keys.next();
        while (!entry.done) {
          object[entry.value] = data.get(entry.value);
          entry = keys.next();
        }
      } else {
        keys.forEach(function (key) {
          object[key] = data.get(key);
        });
      }
      return object;
    }
  };
}
