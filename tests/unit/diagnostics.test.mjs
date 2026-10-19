import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDiagnostics } from "../../src/internal/build-diagnostics.js";

test("diagnostics deduplicate retained equivalent contexts without collapsing elements", () => {
  const warning = { code: 1, message: "warning" };
  const diagnostics = buildDiagnostics({ WARNING: warning });
  const first = { nodeType: 1 };
  const second = { nodeType: 1 };
  diagnostics.warn(warning, { element: first, attribute: "id", value: "panel" });
  diagnostics.warn(warning, { element: first, attribute: "id", value: "panel" });
  diagnostics.warn(warning, { element: second, attribute: "id", value: "panel" });
  diagnostics.warn(warning, { element: first, attribute: "id", value: "dialog" });
  assert.equal(diagnostics.showHistory(0).length, 0);
  assert.equal(diagnostics.showHistory().length, 3);
});
