import { Suspense } from "react";
import AnaliseContent from "./AnaliseContent";

export const dynamic = "force-dynamic";

export default function AnalisePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-6 text-sm text-slate-500">
          Carregando análise...
        </div>
      }
    >
      <AnaliseContent />
    </Suspense>
  );
}
