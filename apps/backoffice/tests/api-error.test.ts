import assert from "node:assert/strict";
import { test } from "node:test";
import { apiRequest, ApiRequestError } from "../src/shared/api/http-client";
import { normalizeApiErrorPayload } from "../src/shared/api/api-error";

for (const status of [500, 502, 503, 504]) {
  test(`HTTP ${status} never exposes server diagnostics`, () => {
    const internal = "Invalid prisma.user.findUnique at C:\\private\\api.ts localhost:5433";
    const result = normalizeApiErrorPayload(status, { status: 400, message: internal, userMessage: internal, detail: internal, title: internal, details: { stack: internal }, traceId: "reference-123" });
    assert.equal(result.status, status);
    assert.equal(result.userMessage, "Não foi possível concluir agora. Tente novamente em instantes.");
    assert.equal(result.traceId, "reference-123");
    assert.doesNotMatch(JSON.stringify(result), /prisma|private|localhost|5433/);
  });
}
test("internal error codes are sanitized even with a non-server HTTP status", () => {
  const result = normalizeApiErrorPayload(400, { code: "SF-SYS-500", userMessage: "prisma diagnostics" });
  assert.doesNotMatch(result.userMessage, /prisma/);
});
test("expected authentication and validation messages are preserved", () => {
  assert.equal(normalizeApiErrorPayload(401, { userMessage: "E-mail ou senha inválidos." }).userMessage, "E-mail ou senha inválidos.");
  assert.equal(normalizeApiErrorPayload(400, { userMessage: "Informe um e-mail válido." }).userMessage, "Informe um e-mail válido.");
});
test("connection failures become a friendly error instead of fetch diagnostics", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError("fetch failed: internal network diagnostics"); };
  try {
    await assert.rejects(apiRequest("/auth/login"), (error: unknown) => {
      assert.ok(error instanceof ApiRequestError);
      assert.equal(error.status, 0);
      assert.equal(error.message, "Não foi possível conectar ao serviço. Tente novamente em instantes.");
      return true;
    });
  } finally { globalThis.fetch = original; }
});
