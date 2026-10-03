import { Suspense } from "react";
import ResultadoClient from "./ResultadoClient";

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

export default function ResultadoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            Carregando resultado...
          </div>
        </div>
      }
    >
      <ResultadoClient />
    </Suspense>
  );
}
