const promise_value = async (scope, variable_name, value, tick_ms, timeout) => {
  scope = (scope ?? globalThis);
  return scope[variable_name ?? "variable"] ?? await _promise_value_assist(scope, variable_name ?? "variable", value ?? undefined, tick_ms ?? 100, timeout ?? 60 * 1000);
}

const _promise_value_assist = async (scope, variable_name, value, tick_ms, timeout) => {
  await new Promise((resolve, reject) => {
    var interval = setInterval(() => {
      if (variable_name in scope && (
        (value != undefined && scope[variable_name] == value) ||
        (value == undefined && scope[variable_name] != undefined)
      )) {
        clearInterval(interval);
        resolve();
      }
      timeout -= tick_ms;
      if (timeout <= 0) {
        clearInterval(interval);
        reject(new Error("Promise value '" + variable_name + "' timeout "));
      }
    }, tick_ms);
  });
  return scope[variable_name] ?? undefined;
}