import assert from "node:assert/strict";
import test from "node:test";

import { safeInternalPath } from "./safe-path.ts";

const fallback = "/dashboard";

test("keeps internal paths", () => {
  assert.equal(safeInternalPath("/meetings/new", fallback), "/meetings/new");
});

test("rejects external and protocol-relative targets", () => {
  assert.equal(safeInternalPath("https://evil.example", fallback), fallback);
  assert.equal(safeInternalPath("//evil.example", fallback), fallback);
  assert.equal(safeInternalPath("/\\evil.example", fallback), fallback);
  assert.equal(safeInternalPath("javascript:alert(1)", fallback), fallback);
});
