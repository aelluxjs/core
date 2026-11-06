/*! aellux.js | SPDX-License-Identifier: Apache-2.0 | See LICENSE for terms. */

// Available before init(), including in the ES5 boot. It knows contracts,
// owners and callbacks, never Extension implementations or device semantics.
export function createCommunication(diagnostics) {
  var commands = Object.create(null);
  var listeners = Object.create(null);
  var order = 0;
  var api = { handle: handle, request: request, has: has, on: on, emit: emit,
    removeOwner: removeOwner, clear: clear };
  return api;

  function validate(name, callback, options) {
    if (typeof name !== "string" || !name.trim() || typeof callback !== "function" ||
      (options.priority !== undefined && (typeof options.priority !== "number" || !isFinite(options.priority)))) {
      throw new TypeError("Communication requires a nonempty contract, a function and a finite priority.");
    }
  }
  function register(name, callback, options, command) {
    options = options || {};
    validate(name, callback, options);
    var signal = options.signal;
    if (signal && (typeof signal.addEventListener !== "function" || typeof signal.removeEventListener !== "function")) {
      throw new TypeError("Communication signal must support abort listeners.");
    }
    if (signal && signal.aborted) return function () {};
    if (command && commands[name]) {
      var context = { contract: name, owner: options.owner, registeredOwner: commands[name].owner };
      throw diagnostics ? diagnostics.error(diagnostics.ERROR_COMM_DUPLICATE, context) :
        new Error("Communication contract already handled: " + name);
    }
    var entry = { callback: callback, owner: options.owner, priority: options.priority || 0,
      order: order++, active: true, remove: remove };
    if (command) commands[name] = entry;
    else {
      if (!listeners[name]) listeners[name] = [];
      listeners[name].push(entry);
      listeners[name].sort(function (a, b) { return b.priority - a.priority || a.order - b.order; });
    }
    if (signal) signal.addEventListener("abort", remove, { once: true });
    return remove;

    function remove() {
      if (!entry.active) return;
      entry.active = false;
      if (command) { if (commands[name] === entry) delete commands[name]; }
      else {
        var list = listeners[name];
        var index = list ? list.indexOf(entry) : -1;
        if (index !== -1) list.splice(index, 1);
        if (list && !list.length) delete listeners[name];
      }
      if (signal) signal.removeEventListener("abort", remove);
    }
  }
  function handle(name, callback, options) { return register(name, callback, options, true); }
  function on(name, callback, options) { return register(name, callback, options, false); }
  function has(name) { return Object.prototype.hasOwnProperty.call(commands, name); }
  function request(name, payload) {
    var entry = commands[name];
    return entry ? { handled: true, value: entry.callback(payload) } : { handled: false, value: undefined };
  }
  function report(cause, name, owner) {
    if (diagnostics) diagnostics.error(diagnostics.ERROR_COMM_CALLBACK, { cause: cause, contract: name, owner: owner });
  }
  function emit(name, payload) {
    var snapshot = listeners[name] ? listeners[name].slice() : [];
    var count = 0;
    for (var i = 0; i < snapshot.length; i++) {
      var entry = snapshot[i];
      if (!entry.active) continue;
      count++;
      try {
        var result = entry.callback(payload);
        if (result && typeof result.then === "function") {
          result.then(null, (function (owner) { return function (cause) { report(cause, name, owner); }; })(entry.owner));
        }
      } catch (cause) { report(cause, name, entry.owner); }
    }
    return count;
  }
  function entries() {
    var all = Object.keys(commands).map(function (name) { return commands[name]; });
    Object.keys(listeners).forEach(function (name) { all = all.concat(listeners[name]); });
    return all;
  }
  function removeOwner(owner) {
    entries().forEach(function (entry) { if (entry.owner === owner) entry.remove(); });
  }
  function clear() { entries().forEach(function (entry) { entry.remove(); }); }
}
