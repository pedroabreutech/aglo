import assert from "node:assert/strict";
import { test } from "node:test";
import { readApiError, readApiResponse } from "../apiResponse";

const fallback = "Falha ao processar a contagem.";

test("502 HTML mostra falha do serviço, sem expor o erro de parsing", async () => {
  const response = new Response("<!DOCTYPE html><h1>Bad gateway</h1>", {
    status: 502,
    headers: { "Content-Type": "text/html" },
  });
  await assert.rejects(readApiResponse(response, fallback), {
    message: `${fallback} Falha na comunicação com o serviço (HTTP 502). Tente novamente em instantes.`,
  });
});

test("504 sem corpo também informa a falha de comunicação", async () => {
  const message = await readApiError(
    new Response(null, { status: 504 }),
    fallback,
  );
  assert.match(message, /Falha na comunicação.*HTTP 504/);
});

test("preserva mensagens JSON da API, inclusive o diagnóstico do P2PNet", async () => {
  for (const field of ["error", "message"]) {
    const message = "Failed to call P2Pnet: fetch failed (ECONNREFUSED)";
    const response = Response.json({ [field]: message }, { status: 502 });
    assert.equal(await readApiError(response, fallback), message);
  }
});

test("erro estruturado sem mensagem textual usa o fallback HTTP", async () => {
  const response = Response.json(
    { error: { code: "invalid" } },
    { status: 400 },
  );
  assert.equal(
    await readApiError(response, fallback),
    `${fallback} (HTTP 400).`,
  );
});

test("resposta JSON de sucesso mantém os dados do relatório", async () => {
  const report = { id: "test-report", estimatedCount: 120, finalizada: true };
  assert.deepEqual(
    await readApiResponse(Response.json(report), fallback),
    report,
  );
});

test("HTML com status 200 é tratado como resposta inválida", async () => {
  await assert.rejects(
    readApiResponse(new Response("<html>Unavailable</html>"), fallback),
    {
      message: `${fallback} O servidor retornou uma resposta inválida.`,
    },
  );
});
