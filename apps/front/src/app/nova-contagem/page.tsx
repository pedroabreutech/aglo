import { Suspense } from "react";
import { NovaContagemForm } from "./NovaContagemForm";

export default function NovaContagem() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 py-[30px] px-[60px]">
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700">
            Carregando formulário...
          </div>
        </div>
      }
    >
      <NovaContagemForm />
    </Suspense>
  );
}
