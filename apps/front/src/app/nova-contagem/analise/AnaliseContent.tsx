"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReferenceImageViewer from "@/src/components/ReferenceImageViewer/ReferenceImageViewer";
import type { Contagem, CountingMethod } from "@/src/types/IContagem";
import { resolveCountingMethod } from "@/src/lib/countingMethod";
import { clearLegacyP2pnetSessionCache } from "@/src/lib/clearLegacyP2pnetSessionCache";
import { readApiError, readApiResponse } from "@/src/lib/apiResponse";
import { DEFAULT_DETECTION_THRESHOLD } from "@/src/components/ConfidenceThresholdSlider/ConfidenceThresholdSlider";
import { AnaliseSidebar } from "./AnaliseSidebar";

export default function AnaliseContent() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("analysisId");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contagem, setContagem] = useState<Contagem | null>(null);
  const [countingMethod, setCountingMethod] =
    useState<CountingMethod>("automatic");
  const [detectionThreshold, setDetectionThreshold] = useState(
    DEFAULT_DETECTION_THRESHOLD,
  );
  const [nextLoading, setNextLoading] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) {
      setError("Nenhuma análise informada.");
      setLoading(false);
      return;
    }

    const loadReport = async () => {
      try {
        const response = await fetch(
          `/api/contagem?analysisId=${encodeURIComponent(analysisId)}`,
          { cache: "no-store" },
        );
        const payload = await readApiResponse<Contagem>(
          response,
          "Falha ao carregar a análise.",
        );
        setContagem(payload);
        setCountingMethod(resolveCountingMethod(payload.countingMethod));
        setDetectionThreshold(
          payload.detectionThreshold ?? DEFAULT_DETECTION_THRESHOLD,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido.");
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [analysisId]);

  const saveCountingMethod = async (id: string, method: CountingMethod) => {
    const response = await fetch(
      `/api/contagem?analysisId=${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countingMethod: method }),
      },
    );

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "Falha ao salvar o modo de contagem."),
      );
    }
  };

  const processReport = async (
    id: string,
    method: CountingMethod,
    threshold: number,
  ) => {
    const response = await fetch(
      `/api/p2pnet?analysisId=${encodeURIComponent(id)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countingMethod: method, threshold }),
      },
    );

    return readApiResponse<Contagem>(response, "Falha ao processar a contagem.");
  };

  const handleGenerateOrRedo = async () => {
    if (!contagem?.id) return;

    if (contagem.finalizada) {
      const confirmed = window.confirm(
        "A contagem será refeita com o modo e o limiar atuais. Deseja continuar?",
      );
      if (!confirmed) return;
    }

    setPredictError(null);
    setNextLoading(true);

    try {
      await saveCountingMethod(contagem.id, countingMethod);
      await processReport(contagem.id, countingMethod, detectionThreshold);
      clearLegacyP2pnetSessionCache();
      router.push(`/relatorios/${contagem.id}`);
    } catch (err) {
      setPredictError(
        err instanceof Error
          ? err.message
          : "Erro inesperado ao solicitar a contagem.",
      );
    } finally {
      setNextLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 bg-slate-50 p-6 flex items-center justify-center relative">
        <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white flex flex-col">
          {contagem?.imagePath ? (
            <ReferenceImageViewer
              src={contagem.imagePath}
              alt="Imagem enviada para a contagem"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <p className="text-center text-sm">Nenhuma imagem carregada</p>
            </div>
          )}
        </div>
      </div>

      <AnaliseSidebar
        analysisId={analysisId}
        contagem={contagem}
        loading={loading}
        error={error}
        predictError={predictError}
        nextLoading={nextLoading}
        countingMethod={countingMethod}
        onCountingMethodChange={setCountingMethod}
        detectionThreshold={detectionThreshold}
        onDetectionThresholdChange={setDetectionThreshold}
        onGenerateOrRedo={handleGenerateOrRedo}
      />
    </div>
  );
}
