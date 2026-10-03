"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function renderValue(value: unknown) {
  if (value === null || value === undefined) {
    return <span className="text-[#64748B]">-</span>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-3">
        {value.map((item, index) => (
          <pre
            key={index}
            className="rounded-xl bg-slate-100 p-3 text-sm overflow-x-auto"
          >
            {JSON.stringify(item, null, 2)}
          </pre>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <pre className="rounded-xl bg-slate-100 p-3 text-sm overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <span>{String(value)}</span>;
}

export default function ResultadoClient() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const analysisId = searchParams.get("analysisId");
    if (!analysisId) {
      setError("Nenhuma análise informada.");
      setLoading(false);
      return;
    }

    const loadResult = async () => {
      try {
        const response = await fetch(
          `/api/contagem?analysisId=${encodeURIComponent(analysisId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload?.error || "Falha ao recuperar o resultado.");
        }

        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado.");
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Resultado da contagem automática
            </h1>
            <p className="text-sm text-slate-500">
              Exibindo o resultado enviado pelo serviço P2Pnet.
            </p>
          </div>
          <Link
            href="/nova-contagem"
            className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Voltar para Nova Contagem
          </Link>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-slate-700">
            Carregando resultado...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {Array.isArray(result) ? (
              result.map((item, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-3 text-sm font-semibold text-slate-700">
                    Item {index + 1}
                  </div>
                  {renderValue(item)}
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                {renderValue(result)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
