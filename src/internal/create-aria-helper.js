/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

export function createAriaHelper() {
  const elements = new WeakMap();
  let nextOrder = 0;

  function attributeName(name) {
    if (typeof name !== "string" || !/^(?:aria-)?[a-z][a-z0-9-]*$/.test(name)) {
      throw new TypeError("Invalid ARIA name");
    }
    return name.startsWith("aria-") ? name : `aria-${name}`;
  }

  function attributeValue(name, value) {
    if (value === null || value === undefined) {
      throw new TypeError("Use unset() for null");
    }
    if (Array.isArray(value)) {
      return value.join(" ");
    }
    if (name === "aria-hidden" && typeof value !== "boolean") {
      throw new TypeError("Invalid aria-hidden value");
    }
    return String(value);
  }

  function write(element, name, value) {
    if (value === null) {
      if (element.hasAttribute(name)) element.removeAttribute(name);
    } else if (element.getAttribute(name) !== value) {
      element.setAttribute(name, value);
    }
  }

  function reconcile(element, record, name) {
    let winner = null;
    let hidden = false;
    record.handlers.forEach(handler => {
      if (!handler.values.has(name)) return;
      if (name === "aria-hidden" && handler.values.get(name) === "true") hidden = true;
      if (!winner || handler.priority > winner.priority ||
        (handler.priority === winner.priority && handler.order > winner.order)) {
        winner = handler;
      }
    });
    if (!winner) {
      write(element, name, record.baseline.get(name) ?? null);
      record.baseline.delete(name);
      return;
    }
    write(element, name, name === "aria-hidden" && hidden
      ? "true" : winner.values.get(name));
  }

  function register(element, options = {}) {
    if (!element || element.nodeType !== 1) {
      throw new TypeError("Invalid ARIA element");
    }
    const priority = options.priority === undefined ? 0 : options.priority;
    if (typeof priority !== "number" || !Number.isFinite(priority)) {
      throw new TypeError("Invalid ARIA priority");
    }
    let record = elements.get(element);
    if (!record) {
      record = { handlers: new Set(), baseline: new Map() };
      elements.set(element, record);
    }
    const handler = { priority, order: nextOrder++, values: new Map() };
    record.handlers.add(handler);
    let released = false;

    return {
      set(values) {
        if (released) return false;
        if (!values || typeof values !== "object") {
          throw new TypeError("Invalid ARIA values");
        }
        const updates = Object.entries(values).map(([key, value]) => {
          const name = attributeName(key);
          return [name, attributeValue(name, value)];
        });
        updates.forEach(([name, value]) => {
          if (!record.baseline.has(name)) record.baseline.set(name, element.getAttribute(name));
          handler.values.set(name, value);
          reconcile(element, record, name);
        });
        return true;
      },
      unset(key) {
        if (released) return false;
        const name = attributeName(key);
        if (!handler.values.delete(name)) return false;
        reconcile(element, record, name);
        return true;
      },
      initial(key) {
        const name = attributeName(key);
        return record.baseline.has(name)
          ? record.baseline.get(name) : element.getAttribute(name);
      },
      release() {
        if (released) return false;
        released = true;
        record.handlers.delete(handler);
        handler.values.forEach((_, name) => reconcile(element, record, name));
        handler.values.clear();
        if (!record.handlers.size) elements.delete(element);
        return true;
      }
    };
  }

  return { register };
}
