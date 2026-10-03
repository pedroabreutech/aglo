"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DownloadCloud, LoaderCircle } from "lucide-react";
import AnnotatedImageViewer from "@/src/components/AnnotatedImageViewer/AnnotatedImageViewer";
import { Contagem } from "@/src/types/IContagem";
import { fromIsoEventDate } from "@/src/app/nova-contagem/novaContagemSubmit";
import {
  COUNTING_METHOD_LABELS,
  getAutomaticCount,
  resolveCountingMethod,
} from "@/src/lib/countingMethod";
import { downloadReportMedia } from "@/src/lib/downloadFile";

export default function RelatorioDetailPage() {
  const params = useParams();
  const analysisId = params?.id as string | undefined;
  const [contagem, setContagem] = useState<Contagem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingProcessed, setDownloadingProcessed] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) {
      setError("ID da análise não encontrado.");
      setLoading(false);
      return;
    }

    const loadContagem = async () => {
      try {
        const response = await fetch(`/api/contagem?analysisId=${encodeURIComponent(analysisId)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload?.error || "Falha ao carregar o relatório.");
        }

        const payload = (await response.json()) as Contagem;
        setContagem(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar relatório.");
      } finally {
        setLoading(false);
      }
    };

    loadContagem();
  }, [analysisId]);

  const countingMethod = resolveCountingMethod(contagem?.countingMethod);
  const automaticCountValue = contagem ? getAutomaticCount(contagem) : undefined;
  const reinforcement = contagem?.finalizada
    ? contagem.densityReinforcement
    : undefined;

  const imageSrc =
    contagem?.processedImagePath ?? contagem?.imagePath;
  const hasProcessedImage = Boolean(contagem?.processedImagePath);
  // A imagem processada já inclui os pontos com reforço; sem overlay HTML.
  const overlayPoints = hasProcessedImage
    ? []
    : (contagem?.detectionPoints ?? []);
  const shouldOverlayPoints = overlayPoints.length > 0;

  const handleDownloadProcessed = async () => {
    if (!analysisId || !hasProcessedImage) return;

    setDownloadError(null);
    setDownloadingProcessed(true);
    try {
      await downloadReportMedia({ analysisId, kind: "processed" });
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Falha ao baixar a imagem processada.",
      );
    } finally {
      setDownloadingProcessed(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Relatórios / Detalhes</p>
            <h1 className="text-2xl font-bold text-slate-900">Visualização do relatório</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {analysisId && (
              <>
                {hasProcessedImage && (
                  <button
                    type="button"
                    onClick={handleDownloadProcessed}
                    disabled={downloadingProcessed}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingProcessed ? (
                      <LoaderCircle size={16} className="animate-spin" />
                    ) : (
                      <DownloadCloud size={16} />
                    )}
                    {downloadingProcessed ? "Baixando..." : "Baixar processada"}
                  </button>
                )}
                <Link
                  href={`/nova-contagem/analise?analysisId=${encodeURIComponent(analysisId)}`}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#137FEC] px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Editar e refazer contagem
                </Link>
                <Link
                  href={`/nova-contagem?analysisId=${encodeURIComponent(analysisId)}`}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Editar cadastro do evento
                </Link>
              </>
            )}
            <Link
              href="/relatorios"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar para lista
            </Link>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {loading && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-700">
            Carregando relatório...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && !contagem && (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700">
            Relatório não encontrado.
          </div>
        )}

        {contagem && (
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Relatório</p>
                    <h2 className="text-xl font-semibold text-slate-900">{contagem.eventName}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {contagem.eventType} • {fromIsoEventDate(contagem.eventDate)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#137FEC]">
                      Modo: {COUNTING_METHOD_LABELS[countingMethod]}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${contagem.finalizada ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {contagem.finalizada ? "Finalizada" : "Pendente"}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Contagem automática</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {automaticCountValue !== undefined
                        ? automaticCountValue.toLocaleString("pt-BR")
                        : "—"}
                    </p>
                    {reinforcement?.applied && (
                      <p className="mt-2 text-xs text-slate-600">
                        {reinforcement.originalCount.toLocaleString("pt-BR")} detecções do P2Pnet
                        {" + "}
                        {reinforcement.extraPointsAdded.toLocaleString("pt-BR")} do reforço em zonas densas
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Limiar de detecção</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {contagem.finalizada && contagem.detectionThreshold !== undefined
                        ? `${Math.round(contagem.detectionThreshold * 100)}%`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Endereço</p>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {contagem.location.address}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Data de criação</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {new Date(contagem.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Imagem processada</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Visualize a imagem anotada pelo processo de contagem.
                    </p>
                  </div>
                  {hasProcessedImage && (
                    <button
                      type="button"
                      onClick={handleDownloadProcessed}
                      disabled={downloadingProcessed}
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingProcessed ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <DownloadCloud size={16} />
                      )}
                      {downloadingProcessed ? "Baixando..." : "Baixar processada"}
                    </button>
                  )}
                </div>

                {downloadError && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {downloadError}
                  </p>
                )}

                <div className="mt-5">
                  {imageSrc ? (
                    <AnnotatedImageViewer
                      src={imageSrc}
                      alt="Imagem processada"
                      points={overlayPoints}
                      pointsEmbedded={!shouldOverlayPoints}
                    />
                  ) : (
                    <div className="flex h-[420px] items-center justify-center rounded-3xl bg-slate-100 text-slate-500">
                      Imagem processada não disponível.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
