"use client";

import Link from "next/link";
import Image from "next/image";
import ArrowLaranjaSvg from "../image/arrow-laranja.svg";
import type { Contagem, CountingMethod } from "@/src/types/IContagem";
import { fromIsoEventDate } from "@/src/app/nova-contagem/novaContagemSubmit";
import { CountingMethodSelector } from "@/src/components/CountingMethodSelector/CountingMethodSelector";
import { ConfidenceThresholdSlider } from "@/src/components/ConfidenceThresholdSlider/ConfidenceThresholdSlider";

interface AnaliseSidebarProps {
  analysisId: string | null;
  contagem: Contagem | null;
  loading: boolean;
  error: string | null;
  predictError: string | null;
  nextLoading: boolean;
  countingMethod: CountingMethod;
  onCountingMethodChange: (method: CountingMethod) => void;
  detectionThreshold: number;
  onDetectionThresholdChange: (value: number) => void;
  onGenerateOrRedo: () => void;
}

export function AnaliseSidebar({
  analysisId,
  contagem,
  loading,
  error,
  predictError,
  nextLoading,
  countingMethod,
  onCountingMethodChange,
  detectionThreshold,
  onDetectionThresholdChange,
  onGenerateOrRedo,
}: AnaliseSidebarProps) {
  return (
    <aside className="w-[385px] bg-white border-l-[1px] border-[#137FEC1A] flex flex-col">
      <div className="py-6 flex-1 overflow-y-auto">
        <div className="px-6 border-b-[1.5px] border-[#137FEC0D] mb-[24px]">
          <Link
            href={
              analysisId
                ? `/nova-contagem?analysisId=${encodeURIComponent(analysisId)}`
                : "/nova-contagem"
            }
            className="text-[#FD541E] text-[10px] font-light flex items-center gap-1.5 mb-4"
          >
            <span className="text-[10px]">
              <Image src={ArrowLaranjaSvg} alt="" height={8} />
            </span>
            VOLTAR
          </Link>

          <h2 className="text-lg font-bold text-[#0F172A]">Contagem automática</h2>
          <p className="text-xs text-[#64748B] mb-8 font-light">
            Contagem de pessoas na imagem pelo modelo P2Pnet
          </p>

          {loading && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Carregando dados da análise...
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {contagem && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div className="font-semibold">{contagem.eventName}</div>
              <div className="text-xs text-[#64748B]">
                {contagem.eventType} - {fromIsoEventDate(contagem.eventDate)}
              </div>
              <div className="text-xs text-[#64748B] mt-1">
                Local: {contagem.location.address}
              </div>
              <Link
                href={`/nova-contagem?analysisId=${encodeURIComponent(contagem.id)}`}
                className="mt-2 inline-block cursor-pointer text-xs font-medium text-[#137FEC] hover:underline"
              >
                Editar cadastro do evento
              </Link>
            </div>
          )}

          {predictError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {predictError}
            </div>
          )}
        </div>

        <CountingMethodSelector
          value={countingMethod}
          onChange={onCountingMethodChange}
          disabled={nextLoading}
        />

        <ConfidenceThresholdSlider
          value={detectionThreshold}
          onChange={onDetectionThresholdChange}
          disabled={nextLoading}
        />

        <div className="px-6 pb-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Use imagem de boa qualidade em ângulo de ~90°, sem obstruções
            (árvores, prédios, sombras) que ocultem pessoas.
            {countingMethod === "automatic_conservative"
              ? " O modo conservador usa apenas as detecções diretas do P2Pnet."
              : " O modo automático (P2Pnet denso) é otimizado para multidões muito aglomeradas."}
          </div>
        </div>
      </div>

      <div className="bg-[#F8FAFC] p-6 border-t border-gray-100 space-y-3">
        {contagem?.finalizada && (
          <Link
            href={`/relatorios/${contagem.id}`}
            className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white py-[8px] text-center text-md text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Ver relatório
          </Link>
        )}
        <button
          type="button"
          disabled={!contagem || nextLoading}
          onClick={onGenerateOrRedo}
          className="cursor-pointer bg-[#137FEC] w-full text-md text-white py-[8px] rounded-lg shadow hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {nextLoading
            ? "Processando..."
            : contagem?.finalizada
              ? "Salvar e refazer contagem"
              : "Gerar contagem"}
        </button>
      </div>
    </aside>
  );
}
